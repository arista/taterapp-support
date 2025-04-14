// The main entrypoint for the local server, running the HttpServer
// plus any other required services

import {ExpressServer} from "./ExpressServer"
import {MockApi} from "@backend/mock/MockApi"
import {bindExpressApi} from "@backend/bindExpressApi"

export type Props = {
  port: number
}

export class LocalServer {
  constructor(public props: {port: number}) {}

  get port() {
    return this.props.port
  }

  _expressServer: ExpressServer | null = null
  get expressServer(): ExpressServer {
    const {port, mockApi} = this
    return (this._expressServer ||= (() => {
      return new ExpressServer({
        port,
        addRoutes: (r) => bindExpressApi(r, mockApi),
      })
    })())
  }

  _mockApi: MockApi | null = null
  get mockApi(): MockApi {
    return (this._mockApi ||= (() => {
      return new MockApi()
    })())
  }

  async run() {
    this.initializeSignalHandlers()
    this.startExpressServer()
  }

  initializeSignalHandlers() {
    const signals = ["SIGINT", "SIGQUIT", "SIGTERM"]
    for (const signal of signals) {
      process.on(signal, () => this.onShutdownSignal(signal))
    }
  }

  async startExpressServer() {
    await this.expressServer.start()
  }

  async onShutdownSignal(signal: string) {
    await this.expressServer.shutdown()
    process.exit(0)
  }

  static async start(props: Props) {
    await new LocalServer(props).run()
  }
}

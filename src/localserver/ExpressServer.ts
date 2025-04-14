import express from "express"
import Path from "node:path"
import http from "node:http"
import fs from "node:fs"
import * as Utils from "@lib/utils/Utils"

export interface Props {
  port: number
  addRoutes: (r: express.Router) => void
}

export class ExpressServer {
  _app: express.Express
  _server: http.Server | null = null

  constructor(public props: Props) {
    this._app = express()
    const {port} = this.props

    this._app.use(express.json())

    // Set up the api
    this.props.addRoutes(this._app)
  }

  async start(): Promise<void> {
    const server = await this._app.listen(this.props.port)
    console.log(`Localserver listening on port ${this.props.port}`)
    this._server = server
  }

  async shutdown(): Promise<void> {
    const server = this._server
    if (server != null) {
      await new Promise((resolve) => server.close(resolve))
    }
  }
}

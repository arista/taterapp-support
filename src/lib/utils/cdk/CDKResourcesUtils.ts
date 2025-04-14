import {IConstruct} from "constructs"
import * as ssm from "aws-cdk-lib/aws-ssm"
import * as cdk from "aws-cdk-lib"

export class CDKResourcesUtils {
  constructor(
    public props: {
      scope: IConstruct
    }
  ) {}

  get scope() {
    return this.props.scope
  }

  _ssmStringParams: CachedResources<string> | null = null
  get ssmStringParams(): CachedResources<string> {
    return (this._ssmStringParams ||= (() => {
      return new CachedResources((name) => {
        return ssm.StringParameter.valueForStringParameter(this.scope, name)
      })
    })())
  }

  _ssmSecureStringParams: CachedResources<string> | null = null
  get ssmSecureStringParams(): CachedResources<string> {
    return (this._ssmSecureStringParams ||= (() => {
      return new CachedResources((name) => {
        // The version must be specified for secure SSM params, and
        // must be changed if the value changes
        const version = 1
        return ssm.StringParameter.valueForSecureStringParameter(
          this.scope,
          `ssm-secureparam-${name}`,
          version
        )
      })
    })())
  }

  // Returns the token corresponding to the name of the S3 bucket used
  // to hold codepipeline artifacts
  get artifactBucketName() {
    return this.ssmStringParams.get(
      "/taterapps/common/build/artifact-bucket-name"
    )
  }

  // Returns the token corresponding to the codeconnection arn used to
  // interact with github
  get codestarConnectionArn() {
    return this.ssmStringParams.get(
      "/taterapps/common/build/codestar-connection-arn"
    )
  }

  // Returns the token corresponding to the dockerhub login used to
  // pull base images when building docker images.  Using a login
  // helps with the dockerhub rate limits.
  get dockerhubAccountId() {
    return this.ssmStringParams.get(
      "/taterapps/common/build/dockerhub-account/id"
    )
  }

  // Returns the token corresponding to the dockerhub password for the
  // dockerhubAccountId
  get dockerhubAccountPassword() {
    return this.ssmSecureStringParams.get(
      "/taterapps/common/build/dockerhub-account/password"
    )
  }
}

class CachedResources<T> {
  byName: {[name: string]: T} = {}
  constructor(public createFunc: (name: string) => T) {}
  get(name: string): T {
    return (this.byName[name] ||= (() => this.createFunc(name))())
  }
}

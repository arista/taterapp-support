import {CDKResourcesUtils} from "./CDKResourcesUtils"
import {IConstruct} from "constructs"
import * as cdk from "aws-cdk-lib"

export class TaterappResources extends CDKResourcesUtils {
  constructor(props: {scope: IConstruct}) {
    super(props)
  }

  // Returns a value exported by the taterapp infrastructure CDK stack
  getInfrastructureExport(name: string): string {
    return cdk.Fn.importValue(`taterapp-infrastructure-${name}`)
  }

  // Returns the token corresponding to the name of the S3 bucket used
  // to hold codepipeline artifacts
  get cpArtifactsBucketName() {
    return this.getInfrastructureExport("bucketName-cp-artifacts")
  }

  get cpArtifactsBucket() {
    return this.buckets.get(this.cpArtifactsBucketName)
  }

  // Returns the token corresponding to the name of the S3 bucket used
  // to hold private data
  get privateBucketName() {
    return this.getInfrastructureExport("bucketName-private")
  }

  get privateBucket() {
    return this.buckets.get(this.privateBucketName)
  }

  // Returns the token corresponding to the name of the S3 bucket used
  // to hold public data, such as webapp assets
  get publicBucketName() {
    return this.getInfrastructureExport("bucketName-public")
  }

  get publicBucket() {
    return this.buckets.get(this.publicBucketName)
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

  get abramsonsInfoDomain() {
    return "abramsons.info"
  }

  get abramsonsInfoHostedZone() {
    return this.hostedZones.get(this.abramsonsInfoDomain)
  }
}

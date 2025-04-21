import {CDKResourcesUtils} from "./CDKResourcesUtils"
import {IConstruct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"

export class TaterappResources extends CDKResourcesUtils {
  constructor(props: {scope: IConstruct}) {
    super(props)
  }

  // Returns a value exported by the taterapp infrastructure CDK stack
  getInfrastructureExport(name: string): string {
    return cdk.Fn.importValue(`taterapp-infrastructure:${name}`)
  }

  // Returns the token corresponding to the name of the S3 bucket used
  // to hold codepipeline artifacts
  get cpArtifactsBucketName() {
    return this.getInfrastructureExport("buckets:cp-artifacts:name")
  }

  get cpArtifactsBucket() {
    return this.buckets.get(this.cpArtifactsBucketName)
  }

  // Returns the token corresponding to the name of the S3 bucket used
  // to hold private data
  get privateBucketName() {
    return this.getInfrastructureExport("buckets:private:name")
  }

  get privateBucket() {
    return this.buckets.get(this.privateBucketName)
  }

  // Returns the token corresponding to the name of the S3 bucket used
  // to hold public data, such as webapp assets
  get publicBucketName() {
    return this.getInfrastructureExport("buckets:public:name")
  }

  get publicBucket() {
    return this.buckets.get(this.publicBucketName)
  }

  // Returns the vpcId of the common VPC
  get vpcId() {
    return this.getInfrastructureExport("vpc:id")
  }

  _vpc: ec2.IVpc | null = null
  get vpc(): ec2.IVpc {
    return (this._vpc ||= (() => {
      return ec2.Vpc.fromVpcAttributes(this.scope, `vpc-byId-${this.vpcId}`, {
        vpcId: this.vpcId,
        availabilityZones: this.vpcAzs,
        privateSubnetIds: this.privateSubnetIds,
      })
    })())
  }

  get vpcAzs() {
    return this.getInfrastructureExport("vpc:azs").split(",")
  }

  getSubnetIds(name: string): Array<string> {
    return this.getInfrastructureExport(`vpc:subnets:${name}:subnetIds`).split(
      ","
    )
  }

  // The ids of the vpc subnets open to the internet
  get publicSubnetIds() {
    return this.getSubnetIds("public")
  }

  get publicSubnets() {
    return this.publicSubnetIds.map((id) => this.subnetsById.get(id))
  }

  // The ids of the vpc subnets blocked from internet ingress, but
  // still with outbound access through the vpc's nat
  get privateSubnetIds() {
    return this.getSubnetIds("private")
  }

  get privateSubnets() {
    return this.privateSubnetIds.map((id) => this.subnetsById.get(id))
  }

  // The ids of the vpc subnets blocked from the internet
  get isolatedSubnetIds() {
    return this.getSubnetIds("isolated")
  }

  get isolatedSubnets() {
    return this.isolatedSubnetIds.map((id) => this.subnetsById.get(id))
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

  get dbEndpointAddress() {
    return this.getInfrastructureExport("db:endpoint:address")
  }

  get dbEndpointPort() {
    return parseInt(this.getInfrastructureExport("db:endpoint:port"))
  }

  get dbAdminCredentialsSecretName() {
    return this.getInfrastructureExport("db:credentials:admin:secret-name")
  }

  get dbSecurityGroupId() {
    return this.getInfrastructureExport("db:security-group-id")
  }

  get dbSecurityGroup() {
    return this.securityGroupsById.get(this.dbSecurityGroupId)
  }
}

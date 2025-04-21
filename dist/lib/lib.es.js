var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/utils/Utils.ts
var Utils_exports = {};
__export(Utils_exports, {
  appPkgDir: () => appPkgDir,
  dateToYYYYMMDDHHMMSS: () => dateToYYYYMMDDHHMMSS,
  fileExists: () => fileExists,
  fileLastModified: () => fileLastModified,
  getPathToRoot: () => getPathToRoot,
  mapWithIndex: () => mapWithIndex,
  notNull: () => notNull,
  runShellCommand: () => runShellCommand
});
import { packageDirectorySync } from "pkg-dir";
import * as url from "node:url";
import child_process from "node:child_process";
import fs from "node:fs";
function notNull(val, str) {
  if (val == null) {
    if (str == null) {
      throw new Error(`Assertion failed: value is null`);
    } else {
      throw new Error(`Assertion failed: value is null: ${str}`);
    }
  }
  return val;
}
function appPkgDir(importMetaUrl) {
  const __filename = url.fileURLToPath(importMetaUrl);
  return notNull(packageDirectorySync({ cwd: __filename }));
}
function getPathToRoot(path) {
  if (path.startsWith("/")) {
    path = path.substring(1);
  }
  let ret = "";
  for (const c of path) {
    if (c === "/") {
      ret += "../";
    }
  }
  return ret;
}
function mapWithIndex(items, f) {
  const ret = [];
  let i = 0;
  for (const item of items) {
    ret.push(f(item, i));
    i += 1;
  }
  return ret;
}
async function runShellCommand({
  command,
  args,
  cwd,
  env,
  shell
}) {
  return new Promise((resolve, reject) => {
    const proc = child_process.spawn(command, args, {
      cwd,
      env,
      // Use the same stdin, stdout, stderr as this process
      stdio: "inherit",
      shell
    });
    proc.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else if (code != null) {
        reject(new Error(`Process exitted with non-zero code "${code}"`));
      } else if (signal != null) {
        reject(new Error(`Process terminated with signal "${signal}"`));
      } else {
        reject(new Error(`Process exitted with no exit code or signal`));
      }
    });
    proc.on("error", (err) => {
      reject(err);
    });
  });
}
function fileExists(path) {
  try {
    fs.statSync(path);
    return true;
  } catch (e) {
    return false;
  }
}
function fileLastModified(path) {
  return fs.statSync(path).mtimeMs;
}
function dateToYYYYMMDDHHMMSS(d = /* @__PURE__ */ new Date()) {
  const yyyy = d.getFullYear().toString().padStart(4, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-${h}${m}${s}`;
}

// src/lib/utils/cdk/CDKUtils.ts
import * as cdk3 from "aws-cdk-lib";

// src/lib/utils/cdk/CDKPermissionsUtils.ts
import * as iam from "aws-cdk-lib/aws-iam";
var CDKPermissionsUtils = class {
  addToRole(role, permissions) {
    for (const permission of permissions) {
      const policyStatement = new iam.PolicyStatement();
      policyStatement.addActions(...permission.actions);
      if (permission.resources != null) {
        policyStatement.addResources(...permission.resources);
      }
      role.addToPrincipalPolicy(policyStatement);
    }
  }
  toCreateAndDeleteSqsQueues() {
    return [
      {
        actions: ["sqs:CreateQueue", "sqs:DeleteQueue"],
        resources: ["arn:aws:sqs:*"]
      }
    ];
  }
  toReadAndWriteSqsQueues() {
    return [
      {
        actions: ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:SendMessage"],
        resources: ["arn:aws:sqs:*"]
      }
    ];
  }
  toReadAndWriteS3Bucket(bucket) {
    return [
      {
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:GetObjectAttributes",
          // Needed for writing a large file with s3 cp
          "s3:AbortMultipartUpload",
          "s3:ListMultipartUploadParts",
          "s3:ListBucketMultipartUploads",
          // Needed for copying a large file within s3
          "s3:PutObjectTagging",
          "s3:GetObjectTagging",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionTagging"
        ],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`]
      }
    ];
  }
  toReadS3Bucket(bucket) {
    return [
      {
        actions: [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:GetObjectAttributes",
          "s3:GetObjectTagging",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionTagging"
        ],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`]
      }
    ];
  }
  toWriteS3BucketObjects(bucket) {
    return [
      {
        actions: ["s3:PutObject", "s3:PutObjectAcl"],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`]
      }
    ];
  }
  toPullECRImages() {
    return [
      {
        actions: [
          "ecr:BatchCheckLayerForAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ],
        resources: ["*"]
      }
    ];
  }
  toUseCDK() {
    return [
      {
        actions: ["sts:AssumeRole"],
        resources: ["arn:aws:iam::*:role/cdk-*"]
      },
      {
        actions: ["sts:PassRole"],
        resources: ["*"]
      },
      // Taking down a CDK stack (effectively a cloudformation stack)
      // requires a separate permission
      {
        actions: ["cloudformation:DeleteStack"],
        resources: [`*`]
      }
    ];
  }
  toReadCDKOutputs() {
    return [
      {
        actions: ["cloudformation:DescribeStacks"],
        resources: [`*`]
      }
    ];
  }
  toLoginToECR() {
    return [
      {
        actions: ["ecr:GetAuthorizationToken"],
        resources: [`*`]
      }
    ];
  }
  toPushToECR(repositories) {
    return [
      {
        actions: [
          "ecr:CompleteLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:InitiateLayerUpload",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage"
        ],
        resources: repositories.map((r) => r.repositoryArn)
      }
    ];
  }
  toUpdateLambdaCode(functionName) {
    return [
      {
        actions: ["lambda:UpdateFunctionCode", "lambda:GetFunction"],
        resources: [`arn:aws:lambda:*:*:function:${functionName}`]
      }
    ];
  }
};

// src/lib/utils/cdk/CDKResourcesUtils.ts
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ec2 from "aws-cdk-lib/aws-ec2";
var CDKResourcesUtils = class {
  constructor(props) {
    this.props = props;
  }
  get scope() {
    return this.props.scope;
  }
  _ssmStringParams = null;
  get ssmStringParams() {
    return this._ssmStringParams ||= (() => {
      return new CachedResources((name) => {
        return ssm.StringParameter.valueForStringParameter(this.scope, name);
      });
    })();
  }
  _ssmSecureStringParams = null;
  get ssmSecureStringParams() {
    return this._ssmSecureStringParams ||= (() => {
      return new CachedResources((name) => {
        const version = 1;
        return ssm.StringParameter.valueForSecureStringParameter(
          this.scope,
          `ssm-secureparam-${name}`,
          version
        );
      });
    })();
  }
  _s3Buckets = null;
  get buckets() {
    return this._s3Buckets ||= (() => {
      return new CachedResources((name) => {
        return s3.Bucket.fromBucketName(this.scope, `bucket-${name}`, name);
      });
    })();
  }
  _hostedZones = null;
  get hostedZones() {
    return this._hostedZones ||= (() => {
      return new CachedResources((name) => {
        return route53.HostedZone.fromLookup(
          this.scope,
          `hosted-zone-${name.replace(/\./g, "")}`,
          {
            domainName: name
          }
        );
      });
    })();
  }
  _subnetsById = null;
  get subnetsById() {
    return this._subnetsById ||= (() => {
      return new CachedResources((name) => {
        return ec2.Subnet.fromSubnetId(this.scope, `subnet-byId-${name}`, name);
      });
    })();
  }
  _securityGroupsById = null;
  get securityGroupsById() {
    return this._securityGroupsById ||= (() => {
      return new CachedResources((name) => {
        return ec2.SecurityGroup.fromSecurityGroupId(
          this.scope,
          `sg-byId-${name}`,
          name
        );
      });
    })();
  }
};
var CachedResources = class {
  constructor(createFunc) {
    this.createFunc = createFunc;
  }
  byName = {};
  get(name) {
    return this.byName[name] ||= (() => this.createFunc(name))();
  }
};

// src/lib/utils/cdk/TaterappResources.ts
import * as cdk from "aws-cdk-lib";
import * as ec22 from "aws-cdk-lib/aws-ec2";
var TaterappResources = class extends CDKResourcesUtils {
  constructor(props) {
    super(props);
  }
  // Returns a value exported by the taterapp infrastructure CDK stack
  getInfrastructureExport(name) {
    return cdk.Fn.importValue(`taterapp-infrastructure:${name}`);
  }
  // Returns the token corresponding to the name of the S3 bucket used
  // to hold codepipeline artifacts
  get cpArtifactsBucketName() {
    return this.getInfrastructureExport("buckets:cp-artifacts:name");
  }
  get cpArtifactsBucket() {
    return this.buckets.get(this.cpArtifactsBucketName);
  }
  // Returns the token corresponding to the name of the S3 bucket used
  // to hold private data
  get privateBucketName() {
    return this.getInfrastructureExport("buckets:private:name");
  }
  get privateBucket() {
    return this.buckets.get(this.privateBucketName);
  }
  // Returns the token corresponding to the name of the S3 bucket used
  // to hold public data, such as webapp assets
  get publicBucketName() {
    return this.getInfrastructureExport("buckets:public:name");
  }
  get publicBucket() {
    return this.buckets.get(this.publicBucketName);
  }
  // Returns the vpcId of the common VPC
  get vpcId() {
    return this.getInfrastructureExport("vpc:id");
  }
  _vpc = null;
  get vpc() {
    return this._vpc ||= (() => {
      return ec22.Vpc.fromVpcAttributes(this.scope, `vpc-byId-${this.vpcId}`, {
        vpcId: this.vpcId,
        availabilityZones: this.vpcAzs,
        privateSubnetIds: this.privateSubnetIds
      });
    })();
  }
  get vpcAzs() {
    return this.getInfrastructureExport("vpc:azs").split(",");
  }
  getSubnetIds(name) {
    return this.getInfrastructureExport(`vpc:subnets:${name}:subnetIds`).split(
      ","
    );
  }
  // The ids of the vpc subnets open to the internet
  get publicSubnetIds() {
    return this.getSubnetIds("public");
  }
  get publicSubnets() {
    return this.publicSubnetIds.map((id) => this.subnetsById.get(id));
  }
  // The ids of the vpc subnets blocked from internet ingress, but
  // still with outbound access through the vpc's nat
  get privateSubnetIds() {
    return this.getSubnetIds("private");
  }
  get privateSubnets() {
    return this.privateSubnetIds.map((id) => this.subnetsById.get(id));
  }
  // The ids of the vpc subnets blocked from the internet
  get isolatedSubnetIds() {
    return this.getSubnetIds("isolated");
  }
  get isolatedSubnets() {
    return this.isolatedSubnetIds.map((id) => this.subnetsById.get(id));
  }
  // Returns the token corresponding to the codeconnection arn used to
  // interact with github
  get codestarConnectionArn() {
    return this.ssmStringParams.get(
      "/taterapps/common/build/codestar-connection-arn"
    );
  }
  // Returns the token corresponding to the dockerhub login used to
  // pull base images when building docker images.  Using a login
  // helps with the dockerhub rate limits.
  get dockerhubAccountId() {
    return this.ssmStringParams.get(
      "/taterapps/common/build/dockerhub-account/id"
    );
  }
  // Returns the token corresponding to the dockerhub password for the
  // dockerhubAccountId
  get dockerhubAccountPassword() {
    return this.ssmSecureStringParams.get(
      "/taterapps/common/build/dockerhub-account/password"
    );
  }
  get abramsonsInfoDomain() {
    return "abramsons.info";
  }
  get abramsonsInfoHostedZone() {
    return this.hostedZones.get(this.abramsonsInfoDomain);
  }
  get dbEndpointAddress() {
    return this.getInfrastructureExport("db:endpoint:address");
  }
  get dbEndpointPort() {
    return parseInt(this.getInfrastructureExport("db:endpoint:port"));
  }
  get dbAdminCredentialsSecretName() {
    return this.getInfrastructureExport("db:credentials:admin:secret-name");
  }
  get dbSecurityGroupId() {
    return this.getInfrastructureExport("db:security-group-id");
  }
  get dbSecurityGroup() {
    return this.securityGroupsById.get(this.dbSecurityGroupId);
  }
};

// src/lib/utils/cdk/CDKRecipes.ts
import * as cdk2 from "aws-cdk-lib";
import * as s32 from "aws-cdk-lib/aws-s3";
var CDKRecipes = class {
  constructor() {
  }
  s3Bucket(scope, id, props) {
    const { name, isPublic, isHostable, removePolicy, cors } = props;
    const access = isPublic ? {
      publicReadAccess: true,
      blockPublicAccess: new s32.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      })
    } : {
      publicReadAccess: false
    };
    const hostable = isHostable ? {
      // This is apparently how you do s3 http hosting
      websiteIndexDocument: "index.html"
    } : {};
    const removal = (() => {
      switch (removePolicy) {
        case "no-delete":
          return {};
        case "delete-if-empty":
          return {
            removalPolicy: cdk2.RemovalPolicy.DESTROY
          };
        case "empty-and-delete":
          return {
            removalPolicy: cdk2.RemovalPolicy.DESTROY,
            autoDeleteObjects: true
          };
        default:
          return {};
      }
    })();
    const bucket = new s32.Bucket(scope, id, {
      bucketName: name,
      ...access,
      ...hostable,
      ...removal
    });
    if (cors != null) {
      switch (cors) {
        case "allow-all-origins":
          bucket.addCorsRule({
            allowedMethods: [s32.HttpMethods.GET],
            allowedOrigins: ["*"],
            allowedHeaders: ["*"],
            maxAge: 3e3
          });
          break;
        case "none":
          break;
        default:
          const unexpected = cors;
          break;
      }
    }
    return bucket;
  }
};

// src/lib/utils/cdk/CDKUtils.ts
var CDKUtils = class {
  constructor(props) {
    this.props = props;
  }
  get scope() {
    return this.props.scope;
  }
  _permissions = null;
  get permissions() {
    return this._permissions ||= (() => {
      return new CDKPermissionsUtils();
    })();
  }
  _resources = null;
  get resources() {
    return this._resources ||= (() => {
      return new TaterappResources({
        scope: this.scope
      });
    })();
  }
  _recipes = null;
  get recipes() {
    return this._recipes ||= (() => {
      return new CDKRecipes();
    })();
  }
  static async runCDKCommand({
    appPkgDir: appPkgDir2,
    appClass,
    cdkCommand,
    stackProps
  }) {
    const nodeFile = `${appPkgDir2}/dist/lib/lib.es.js`;
    const nodeCommand = `node -e "import('${nodeFile}').then(i=>i.${appClass}.runCDKStack())"`;
    const timestamp = dateToYYYYMMDDHHMMSS();
    const cdkOutputDir = `${appPkgDir2}/build/cdk.out/${appClass}/${timestamp}`;
    const command = "npx";
    const shell = false;
    const stackPropsJson = JSON.stringify(stackProps);
    const env = {
      CDK_PROPS: stackPropsJson,
      ...process.env
    };
    const args = [];
    args.push(`cdk`);
    args.push(`--app`, nodeCommand);
    args.push(`-o`, cdkOutputDir);
    args.push(cdkCommand);
    args.push(`--require-approval`, `never`);
    args.push(`--force`);
    return await runShellCommand({
      command,
      args,
      env,
      shell,
      cwd: appPkgDir2
    });
  }
  static runCDKStack({
    getStackName,
    buildStack
  }) {
    const env = JSON.parse(notNull(process.env["CDK_PROPS"]));
    const stackProps = env;
    const stackName = getStackName({ stackProps });
    const app = new cdk3.App();
    const stack = new cdk3.Stack(app, stackName, {
      // This enables things like looking up hostnames.  Note that
      // these don't have to be defined as environment variables - CDK
      // will figure them out itself based on the AWS configuration
      env: {
        account: process.env["CDK_DEFAULT_ACCOUNT"],
        region: process.env["CDK_DEFAULT_REGION"]
      }
    });
    buildStack({ parent: stack, stackProps });
  }
  //--------------------------------------------------
};
export {
  CDKResourcesUtils,
  CDKUtils,
  Utils_exports as Utils
};
//# sourceMappingURL=lib.es.js.map

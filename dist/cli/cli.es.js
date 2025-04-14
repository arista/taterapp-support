// src/cli/commands/cdk/build-code-pipeline.ts
import * as OC from "@oclif/core";

// src/lib/utils/cdk/CDKUtils.ts
import * as cdk from "aws-cdk-lib";

// src/lib/utils/Utils.ts
import { packageDirectorySync } from "pkg-dir";
import * as url from "node:url";
import child_process from "node:child_process";
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
function getPackageDirectory() {
  const __filename = url.fileURLToPath(import.meta.url);
  return notNull(packageDirectorySync({ cwd: __filename }));
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
function dateToYYYYMMDDHHMMSS(d = /* @__PURE__ */ new Date()) {
  const yyyy = d.getFullYear().toString().padStart(4, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-${h}${m}${s}`;
}

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
  // Returns the token corresponding to the name of the S3 bucket used
  // to hold codepipeline artifacts
  get artifactBucketName() {
    return this.ssmStringParams.get(
      "/taterapps/common/build/artifact-bucket-name"
    );
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
      return new CDKResourcesUtils({
        scope: this.scope
      });
    })();
  }
  static async runCDKCommand({
    appClass,
    cdkCommand,
    stackProps
  }) {
    const pkgdir = getPackageDirectory();
    const nodeFile = `${pkgdir}/dist/lib/lib.es.js`;
    const nodeCommand = `node -e "import('${nodeFile}').then(i=>i.${appClass}.runCDKStack())"`;
    const timestamp = dateToYYYYMMDDHHMMSS();
    const cdkOutputDir = `${pkgdir}/build/cdk.out/${appClass}/${timestamp}`;
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
      cwd: pkgdir
    });
  }
  static runCDKStack({
    getStackName,
    buildStack
  }) {
    const env = JSON.parse(notNull(process.env["CDK_PROPS"]));
    const stackProps = env;
    const stackName = getStackName({ stackProps });
    const app = new cdk.App();
    const stack = new cdk.Stack(app, stackName, {
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

// src/lib/cdk/BuildCodePipeline.ts
import { Construct } from "constructs";
import * as cdk2 from "aws-cdk-lib";
import * as cp from "aws-cdk-lib/aws-codepipeline";
import * as cp_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as cb from "aws-cdk-lib/aws-codebuild";
import * as s3 from "aws-cdk-lib/aws-s3";
var Stack2 = class _Stack extends Construct {
  constructor(scope, id, stackProps) {
    super(scope, id);
    const { branch } = stackProps;
    const sourceOutput = new cp.Artifact();
    const cdkUtils = new CDKUtils({ scope: this });
    const owner = "arista";
    const repo = "taterapp-template";
    const codebuildProject = new cb.PipelineProject(
      this,
      "TaterappTemplate-BuildCodePipeline",
      {
        projectName: `TaterappTemplate-Build-${branch}`,
        environment: {
          buildImage: cb.LinuxBuildImage.AMAZON_LINUX_2_5,
          computeType: cb.ComputeType.LARGE
        },
        timeout: cdk2.Duration.minutes(120),
        buildSpec: cb.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            build: {
              commands: /* @__PURE__ */ (() => {
                const ret = [`bin/aws/codepipeline-build`];
                return ret;
              })()
            }
          }
        })
      }
    );
    cdkUtils.permissions.addToRole(notNull(codebuildProject.role), [
      //      ...cdkUtils.permissions.toWriteS3BucketObjects(privateBucket),
      //      ...cdkUtils.permissions.toWriteS3BucketObjects(publicBucket),
      // To deploy the lambda code
      //      ...cdkUtils.permissions.toReadS3Bucket(privateBucket),
      ...cdkUtils.permissions.toUpdateLambdaCode("TaterappTemplate-Webapp")
    ]);
    const artifactBucket = s3.Bucket.fromBucketName(
      this,
      "ArtifactBucket",
      cdkUtils.resources.artifactBucketName
    );
    const pipeline = new cp.Pipeline(this, "TaterappTemplateBuildPipeline", {
      pipelineName: `TaterappTemplateBuild-${branch}`,
      artifactBucket,
      pipelineType: cp.PipelineType.V2,
      stages: [
        {
          stageName: "Source",
          actions: [
            new cp_actions.CodeStarConnectionsSourceAction({
              actionName: "Source",
              connectionArn: cdkUtils.resources.codestarConnectionArn,
              owner,
              repo,
              branch,
              output: sourceOutput,
              variablesNamespace: "SourceVars"
            })
          ]
        },
        {
          stageName: "Build",
          actions: [
            new cp_actions.CodeBuildAction({
              actionName: "Build",
              input: sourceOutput,
              project: codebuildProject,
              variablesNamespace: "BuildVars",
              environmentVariables: {
                PIPELINE_EXECUTION_ID: {
                  value: "#{codepipeline.PipelineExecutionId}"
                },
                GITHUB_COMMIT_ID: { value: "#{SourceVars.CommitId}" },
                GITHUB_BRANCH_NAME: { value: "#{SourceVars.BranchName}" }
              }
            })
          ]
        }
      ]
    });
  }
  static runCDKStack() {
    CDKUtils.runCDKStack({
      getStackName: ({ stackProps }) => {
        const { branch } = stackProps;
        return `TaterappTemplate-BuildCodePipeline-${branch}`;
      },
      buildStack: ({ parent, stackProps }) => {
        new _Stack(parent, "TaterappTemplate-BuildCodePipeline", stackProps);
      }
    });
  }
  static runCDKCommand(props) {
    CDKUtils.runCDKCommand({
      appClass: "BuildCodePipeline.Stack",
      ...props
    });
  }
};

// src/cli/commands/cdk/build-code-pipeline.ts
var Command2 = class _Command extends OC.Command {
  static description = "Manages the CDK stack that handles the CodePipeline for building the application";
  static args = {
    "cdk-command": OC.Args.string({
      description: `The CDK command to execute (deploy, destroy, etc.)`,
      required: true
    })
  };
  static flags = {
    branch: OC.Flags.string({
      char: "b",
      description: `The branch for which the pipeline should be created`,
      required: false,
      default: "main"
    })
  };
  static enableJsonFlag = true;
  async run() {
    const { args, flags } = await this.parse(_Command);
    const cdkCommand = args["cdk-command"];
    const { branch } = flags;
    const stackProps = { branch };
    await Stack2.runCDKCommand({
      cdkCommand,
      stackProps
    });
  }
};

// src/cli/commands/cdk/infrastructure.ts
import * as OC2 from "@oclif/core";

// src/lib/cdk/Infrastructure.ts
import { Construct as Construct2 } from "constructs";
import * as s32 from "aws-cdk-lib/aws-s3";
var Stack3 = class _Stack extends Construct2 {
  constructor(scope, id, stackProps) {
    super(scope, id);
    const cdkUtils = new CDKUtils({ scope: this });
    new s32.Bucket(this, "CodePipelineArtifactsBucket", {
      bucketName: "taterapps-cp-artifacts",
      publicReadAccess: false
    });
    new s32.Bucket(this, "PrivateBucket", {
      bucketName: "taterapps-private",
      publicReadAccess: false
    });
    new s32.Bucket(this, "PublicBucket", {
      bucketName: "taterapps-public",
      // Allow public access
      publicReadAccess: true,
      blockPublicAccess: new s32.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      // Adding this makes the bucket hostable
      websiteIndexDocument: "index.html"
    });
  }
  static runCDKStack() {
    CDKUtils.runCDKStack({
      getStackName: ({ stackProps }) => {
        return `TaterappSupport-Infrastructure`;
      },
      buildStack: ({ parent, stackProps }) => {
        new _Stack(parent, "TaterappSupport-Infrastructure", stackProps);
      }
    });
  }
  static runCDKCommand(props) {
    CDKUtils.runCDKCommand({
      appClass: "Infrastructure.Stack",
      ...props
    });
  }
};

// src/cli/commands/cdk/infrastructure.ts
var Command4 = class _Command extends OC2.Command {
  static description = "Manages the CDK stack that handles the Taterapp infrastructur";
  static args = {
    "cdk-command": OC2.Args.string({
      description: `The CDK command to execute (deploy, destroy, etc.)`,
      required: true
    })
  };
  static flags = {};
  static enableJsonFlag = true;
  async run() {
    const { args, flags } = await this.parse(_Command);
    const cdkCommand = args["cdk-command"];
    const stackProps = {};
    await Stack3.runCDKCommand({
      cdkCommand,
      stackProps
    });
  }
};

// src/cli/cli.ts
var COMMANDS = {
  "cdk:build-code-pipeline": Command2,
  "cdk:infrastructure": Command4
};
export {
  COMMANDS
};
//# sourceMappingURL=cli.es.js.map

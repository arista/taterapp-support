import {CDKUtils} from "@lib/utils/cdk/CDKUtils"
import * as Utils from "@lib/utils/Utils"
import {Construct, IConstruct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as cp from "aws-cdk-lib/aws-codepipeline"
import * as cp_actions from "aws-cdk-lib/aws-codepipeline-actions"
import * as cb from "aws-cdk-lib/aws-codebuild"
import * as s3 from "aws-cdk-lib/aws-s3"

export interface StackProps {
  branch: string
}

export class Stack extends Construct {
  constructor(scope: IConstruct, id: string, stackProps: StackProps) {
    super(scope, id)
    const {branch} = stackProps
    const sourceOutput = new cp.Artifact()
    const cdkUtils = new CDKUtils({scope: this})
    const owner = "arista"
    const repo = "taterapp-template"

    const codebuildProject = new cb.PipelineProject(
      this,
      "TaterappTemplate-BuildCodePipeline",
      {
        projectName: `TaterappTemplate-Build-${branch}`,
        environment: {
          buildImage: cb.LinuxBuildImage.AMAZON_LINUX_2_5,
          computeType: cb.ComputeType.LARGE,
        },
        timeout: cdk.Duration.minutes(120),
        buildSpec: cb.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            build: {
              commands: (() => {
                const ret = [`bin/aws/codepipeline-build`]
                return ret
              })(),
            },
          },
        }),
      }
    )
    cdkUtils.permissions.addToRole(Utils.notNull(codebuildProject.role), [
      //      ...cdkUtils.permissions.toWriteS3BucketObjects(privateBucket),
      //      ...cdkUtils.permissions.toWriteS3BucketObjects(publicBucket),

      // To deploy the lambda code
      //      ...cdkUtils.permissions.toReadS3Bucket(privateBucket),
      ...cdkUtils.permissions.toUpdateLambdaCode("TaterappTemplate-Webapp"),
    ])

    const artifactBucket = s3.Bucket.fromBucketName(
      this,
      "ArtifactBucket",
      cdkUtils.resources.artifactBucketName
    )
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
              variablesNamespace: "SourceVars",
            }),
          ],
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
                  value: "#{codepipeline.PipelineExecutionId}",
                },
                GITHUB_COMMIT_ID: {value: "#{SourceVars.CommitId}"},
                GITHUB_BRANCH_NAME: {value: "#{SourceVars.BranchName}"},
              },
            }),
          ],
        },
      ],
    })
  }

  static runCDKStack() {
    CDKUtils.runCDKStack<StackProps>({
      getStackName: ({stackProps}) => {
        const {branch} = stackProps
        return `TaterappTemplate-BuildCodePipeline-${branch}`
      },
      buildStack: ({parent, stackProps}) => {
        new Stack(parent, "TaterappTemplate-BuildCodePipeline", stackProps)
      },
    })
  }

  static runCDKCommand(props: {cdkCommand: string; stackProps: StackProps}) {
    CDKUtils.runCDKCommand({
      appClass: "BuildCodePipeline.Stack",
      ...props,
    })
  }
}

export interface StackProps {}

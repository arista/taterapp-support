// Creates the AWS infrastructure elements shared by multiple Taterapps

import {CDKUtils} from "@lib/utils/cdk/CDKUtils"
import * as Utils from "@lib/utils/Utils"
import {Construct, IConstruct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as cp from "aws-cdk-lib/aws-codepipeline"
import * as cp_actions from "aws-cdk-lib/aws-codepipeline-actions"
import * as cb from "aws-cdk-lib/aws-codebuild"
import * as s3 from "aws-cdk-lib/aws-s3"

export interface StackProps {
}

export class Stack extends Construct {
  constructor(scope: IConstruct, id: string, stackProps: StackProps) {
    super(scope, id)
    const cdkUtils = new CDKUtils({scope: this})

    // The private bucket for holding codepipeline artifacts
    new s3.Bucket(this, "CodePipelineArtifactsBucket", {
      bucketName: "taterapps-cp-artifacts",
      publicReadAccess: false,
    })    

    // The private bucket for holding data for Taterapps
    new s3.Bucket(this, "PrivateBucket", {
      bucketName: "taterapps-private",
      publicReadAccess: false,
    })    

    // The public bucket for hosting Taterapps assets, etc.
    new s3.Bucket(this, "PublicBucket", {
      bucketName: "taterapps-public",

      // Allow public access
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),

      // Adding this makes the bucket hostable
      websiteIndexDocument: 'index.html',
    })    
  }

  static runCDKStack() {
    CDKUtils.runCDKStack<StackProps>({
      getStackName: ({stackProps}) => {
        return `TaterappSupport-Infrastructure`
      },
      buildStack: ({parent, stackProps}) => {
        new Stack(parent, "TaterappSupport-Infrastructure", stackProps)
      },
    })
  }

  static runCDKCommand(props: {cdkCommand: string; stackProps: StackProps}) {
    CDKUtils.runCDKCommand({
      appClass: "Infrastructure.Stack",
      ...props,
    })
  }
}

export interface StackProps {}

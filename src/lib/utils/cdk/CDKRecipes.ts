import {Construct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as s3 from "aws-cdk-lib/aws-s3"

export class CDKRecipes {
  constructor() {}

  s3Bucket(scope: Construct, id: string, props: S3BucketProps): s3.IBucket {
    const {name, isPublic, isHostable, removePolicy, cors} = props
    const access = isPublic
      ? {
          publicReadAccess: true,
          blockPublicAccess: new s3.BlockPublicAccess({
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false,
          }),
        }
      : {
          publicReadAccess: false,
        }

    const hostable = isHostable
      ? {
          // This is apparently how you do s3 http hosting
          websiteIndexDocument: "index.html",
        }
      : {}

    const removal = (() => {
      switch (removePolicy) {
        case "no-delete":
          return {}
        case "delete-if-empty":
          return {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }
        case "empty-and-delete":
          return {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
          }
        default:
          return {}
      }
    })()

    const bucket = new s3.Bucket(scope, id, {
      bucketName: name,
      ...access,
      ...hostable,
      ...removal,
    })

    if (cors != null) {
      switch (cors) {
        case "allow-all-origins":
          bucket.addCorsRule({
            allowedMethods: [s3.HttpMethods.GET],
            allowedOrigins: ["*"],
            allowedHeaders: ["*"],
            maxAge: 3000,
          })
          break
        case "none":
          break
        default:
          const unexpected: never = cors
          break
      }
    }

    return bucket
  }
}

export type S3BucketProps = {
  name: string
  isPublic?: boolean
  // Can the bucket be used to host http access
  isHostable?: boolean
  // What should happen when the bucket is removed from the stack
  removePolicy?: S3BucketRemovePolicy
  cors?: S3BucketCorsConfig
}

export type S3BucketRemovePolicy =
  // Do not remove the bucket when it's removed from the stack
  | "no-delete"
  // Only remove the bucket if it's empty
  | "delete-if-empty"
  // Empty out the bucket and remove it
  | "empty-and-delete"

export type S3BucketCorsConfig = "none" | "allow-all-origins"

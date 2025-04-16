import { IConstruct, Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cdk from 'aws-cdk-lib';

declare function notNull<T>(val: T | null | undefined, str?: string): T;
declare function appPkgDir(importMetaUrl: string): string;
declare function mapWithIndex<T, R>(items: Iterable<T>, f: (item: T, index: number) => R): Array<R>;
declare function runShellCommand({ command, args, cwd, env, shell, }: {
    command: string;
    args: Array<string>;
    cwd?: string;
    env?: {
        [name: string]: string;
    };
    shell?: boolean | string;
}): Promise<void>;
declare function fileExists(path: string): boolean;
declare function fileLastModified(path: string): number;
declare function dateToYYYYMMDDHHMMSS(d?: Date): string;

declare const Utils_d_appPkgDir: typeof appPkgDir;
declare const Utils_d_dateToYYYYMMDDHHMMSS: typeof dateToYYYYMMDDHHMMSS;
declare const Utils_d_fileExists: typeof fileExists;
declare const Utils_d_fileLastModified: typeof fileLastModified;
declare const Utils_d_mapWithIndex: typeof mapWithIndex;
declare const Utils_d_notNull: typeof notNull;
declare const Utils_d_runShellCommand: typeof runShellCommand;
declare namespace Utils_d {
  export {
    Utils_d_appPkgDir as appPkgDir,
    Utils_d_dateToYYYYMMDDHHMMSS as dateToYYYYMMDDHHMMSS,
    Utils_d_fileExists as fileExists,
    Utils_d_fileLastModified as fileLastModified,
    Utils_d_mapWithIndex as mapWithIndex,
    Utils_d_notNull as notNull,
    Utils_d_runShellCommand as runShellCommand,
  };
}

declare function getPathToRoot(path: string): string;

declare const LambdaUtils_d_getPathToRoot: typeof getPathToRoot;
declare namespace LambdaUtils_d {
  export {
    LambdaUtils_d_getPathToRoot as getPathToRoot,
  };
}

type IamPermissions = Array<IamPermission>;
interface IamPermission {
    actions: Array<string>;
    resources?: Array<string>;
}
declare class CDKPermissionsUtils {
    addToRole(role: iam.IRole, permissions: IamPermissions): void;
    toCreateAndDeleteSqsQueues(): IamPermissions;
    toReadAndWriteSqsQueues(): IamPermissions;
    toReadAndWriteS3Bucket(bucket: s3.IBucket): IamPermissions;
    toReadS3Bucket(bucket: s3.IBucket): IamPermissions;
    toWriteS3BucketObjects(bucket: s3.IBucket): IamPermissions;
    toPullECRImages(): IamPermissions;
    toUseCDK(): IamPermissions;
    toReadCDKOutputs(): IamPermissions;
    toLoginToECR(): IamPermissions;
    toPushToECR(repositories: Array<ecr.IRepository>): IamPermissions;
    toUpdateLambdaCode(functionName: string): IamPermissions;
}

declare class CDKResourcesUtils {
    props: {
        scope: IConstruct;
    };
    constructor(props: {
        scope: IConstruct;
    });
    get scope(): IConstruct;
    _ssmStringParams: CachedResources<string> | null;
    get ssmStringParams(): CachedResources<string>;
    _ssmSecureStringParams: CachedResources<string> | null;
    get ssmSecureStringParams(): CachedResources<string>;
    _s3Buckets: CachedResources<s3.IBucket> | null;
    get buckets(): CachedResources<s3.IBucket>;
}
declare class CachedResources<T> {
    createFunc: (name: string) => T;
    byName: {
        [name: string]: T;
    };
    constructor(createFunc: (name: string) => T);
    get(name: string): T;
}

declare class TaterappResources extends CDKResourcesUtils {
    constructor(props: {
        scope: IConstruct;
    });
    getInfrastructureExport(name: string): string;
    get cpArtifactsBucketName(): string;
    get cpArtifactsBucket(): cdk.aws_s3.IBucket;
    get privateBucketName(): string;
    get privateBucket(): cdk.aws_s3.IBucket;
    get publicBucketName(): string;
    get publicBucket(): cdk.aws_s3.IBucket;
    get codestarConnectionArn(): string;
    get dockerhubAccountId(): string;
    get dockerhubAccountPassword(): string;
}

declare class CDKRecipes {
    constructor();
    s3Bucket(scope: Construct, id: string, props: S3BucketProps): s3.IBucket;
}
type S3BucketProps = {
    name: string;
    isPublic?: boolean;
    isHostable?: boolean;
    removePolicy?: S3BucketRemovePolicy;
};
type S3BucketRemovePolicy = "no-delete" | "delete-if-empty" | "empty-and-delete";

declare class CDKUtils {
    props: {
        scope: IConstruct;
    };
    constructor(props: {
        scope: IConstruct;
    });
    get scope(): IConstruct;
    _permissions: CDKPermissionsUtils | null;
    get permissions(): CDKPermissionsUtils;
    _resources: TaterappResources | null;
    get resources(): TaterappResources;
    _recipes: CDKRecipes | null;
    get recipes(): CDKRecipes;
    static runCDKCommand<P extends Object>({ appPkgDir, appClass, cdkCommand, stackProps, }: {
        appPkgDir: string;
        appClass: string;
        cdkCommand: string;
        stackProps: P;
    }): Promise<void>;
    static runCDKStack<P>({ getStackName, buildStack, }: {
        getStackName: ({ stackProps }: {
            stackProps: P;
        }) => string;
        buildStack: ({ parent, stackProps, }: {
            parent: IConstruct;
            stackProps: P;
        }) => void;
    }): void;
}

export { CDKPermissionsUtils, CDKResourcesUtils, CDKUtils, LambdaUtils_d as LambdaUtils, Utils_d as Utils };
export type { IamPermission, IamPermissions };

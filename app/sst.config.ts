/// <reference path="./.sst/platform/config.d.ts" />
import * as pulumi from "@pulumi/pulumi";

export default $config({
  app(input) {
    return {
      name: "cat-watch",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const site = new sst.aws.StaticSite("Web", {
      build: {
        command: "pnpm run build",
        output: "dist",
      },
    });

    // Create a Canary to monitor the site (create a screenshot every hour)
    const canaryBucket = new aws.s3.Bucket("CanaryBucket");
    const canaryRole = new aws.iam.Role("CanaryRole", {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "synthetics.amazonaws.com",
            },
            Effect: "Allow",
            Sid: "",
          },
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
            Sid: "",
          },
        ],
      }),
    });
    new aws.iam.RolePolicyAttachment("S3PolicyAttachment", {
      role: canaryRole,
      policyArn: "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    });
    new aws.iam.RolePolicyAttachment("CWPolicyAttachment", {
      role: canaryRole,
      policyArn: "arn:aws:iam::aws:policy/CloudWatchFullAccess",
    });
    // new aws.iam.RolePolicyAttachment("SyntheticsPolicyAttachment", {
    //   role: canaryRole,
    //   policyArn: "arn:aws:iam::aws:policy/AmazonSyntheticsFullAccess",
    // });

    site.url.apply((url) => {
      const code = `const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const takeScreenshot = async function () {
    let page = await synthetics.getPage();
    await page.goto('${url}', { waitUntil: 'networkidle0' });
    await page.screenshot({path: '/tmp/screenshot.png'});
    let pageTitle = await page.title();
    log.info('Page title: ' + pageTitle);
    return pageTitle;  // Or any other relevant output
};

export const handler = async () => {
    return await takeScreenshot();
};`;
      const canaryCodeArchive = new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(code),
      });
      const canaryCodeS3Object = new aws.s3.BucketObject("CanaryCode", {
        bucket: canaryBucket.bucket,
        key: "canary.zip",
        source: canaryCodeArchive,
      });

      new aws.synthetics.Canary("ScreenshotCanary", {
        name: "cat-watch-screenshot",
        artifactS3Location: pulumi.interpolate`s3://${canaryBucket.bucket}/`,
        executionRoleArn: canaryRole.arn,
        handler: "exports.handler",
        // From: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html
        runtimeVersion: "syn-nodejs-puppeteer-7.0",
        schedule: {
          expression: "rate(1 hour)",
          durationInSeconds: 3600,
        },
        s3Bucket: canaryBucket.bucket,
        s3Key: canaryCodeS3Object.key,
        s3Version: canaryCodeS3Object.versionId,
      });
    });
  },
});

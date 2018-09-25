# Create Snapshot from Elastic Block Store

Simple script to create snapshot from AWS EBS volume, using JavaScript.

## Prepare AWS Labmda Function

* Create Policy for IAM roles
    ```
    Use policies from policies.json
    ```

* Create Lambda function
    ```
    Runtime: Node.js 8.10
    ```

* Create copy function
    ```
    Copy backupSnapshot.js Lambda function index.js
    ```

* Change region
    ```
    Change region at the top of file to your instance region
    ```

* Add triggers > CloudWatch Events
    ```
    Example: cron(00 19 ? * * *) > for Everyday 19.00 UTC
    For more info : [Event Schedule Expression](https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    ```

## Using AWS Labmda Function to create Snapshot

* Create tag on EBS Volume you want to backup
  * snapshot - Required
    ```
    Key: snapshot, Value: y
    ```
  * retentionDays - Optional [Adding this will enable auto delete after ending retention days]
    ```
    Key: retentionDays, Value: 5 [For 5 day retention]
    ```

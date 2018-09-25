let aws = require('aws-sdk');
let ec2 = new aws.EC2();
aws.config.update({region: 'ap-southeast-1'});


exports.handler = function(event, context, callback) {
    createSnapshotFunc();
    deleteSnapshotFunc();
};


/** Create snapshot from EBS Volume */
async function createSnapshotFunc() {
    // list volume
    let VolumeParam = {
        Filters: [
            {
            Name: 'tag:snapshot',
            Values: ['y'],
            },
        ],
    };
    let volumeList = await listVolume(VolumeParam);

    // loop volume
    for (let volume of volumeList) {
        let volumeId = volume.VolumeId;

        // get tag dictionary
        let tagDict = {};
        for (let tag of volume.Tags) {
            tagDict[tag.Key] = tag.Value;
        }

        // create tag
        let volumeTag = [
            {
                Key: 'volumeId',
                Value: volumeId,
            },
        ];
        // cal delete date
        if ('retentionDays' in tagDict) {
            let deleteDate = calDeleteDate(tagDict.retentionDays);
            volumeTag.push({
                Key: 'autoDel',
                Value: 'y',
            });
            volumeTag.push({
                Key: 'deleteDate',
                Value: deleteDate,
            });
        }

        // create snapshot
        let snapshotParam = {
            VolumeId: volumeId,
            Description: 'Backup of ' +
                volumeId +
                ' [ ' + createTimestamp() + ' ]',
            TagSpecifications: [
                {
                    ResourceType: 'snapshot',
                    Tags: volumeTag,
                },
            ],
        };
        let snapshot = await createSnapshot(snapshotParam);
        console.log(snapshot);
    }
}


/** Delete snapshot from EBS Volume */
async function deleteSnapshotFunc() {
    // get today date
    let todayDate = getTodayDate();

    // list snapshot
    let listSnapshotParam = {
        Filters: [
            {
            Name: 'tag:autoDel',
            Values: ['y'],
            },
            {
            Name: 'tag:deleteDate',
            Values: [todayDate],
            },
        ],
    };
    let snapshotList = await listSnapshot(listSnapshotParam);

    // loop volume
    for (let snapshot of snapshotList) {
        console.log('Delete ' + snapshot.SnapshotId);
        let deleteLog = await deleteSnapshot({
            SnapshotId: snapshot.SnapshotId,
        });
        console.log(deleteLog);
    }
}


/** List volumes
 * @param {dict} param
 * @return {object}
 */
function listVolume(param) {
    return new Promise(function(resolve, reject) {
        ec2.describeVolumes(param, function(err, data) {
            if (err) {
                reject('Error : ' + err + err.stack);
            } else {
                resolve(data.Volumes);
            }
        });
    });
}


/** Create snapshot
 * @param {dict} param
 * @return {object}
 */
function createSnapshot(param) {
    return new Promise(function(resolve, reject) {
        ec2.createSnapshot(param, function(err, data) {
            if (err) {
                reject('Error : ' + err + err.stack);
            } else {
                resolve(data);
            }
        });
    });
}


/** List snapshot
 * @param {dict} param
 * @return {object}
 */
function listSnapshot(param) {
    return new Promise(function(resolve, reject) {
        ec2.describeSnapshots(param, function(err, data) {
            if (err) {
                reject('Error : ' + err + err.stack);
            } else {
                resolve(data.Snapshots);
            }
        });
    });
}


/** Delete snapshot
 * @param {dict} param
 * @return {object}
 */
function deleteSnapshot(param) {
    return new Promise(function(resolve, reject) {
        ec2.deleteSnapshot(param, function(err, data) {
            if (err) {
                reject('Error : ' + err + err.stack);
            } else {
                resolve(data);
            }
        });
    });
}


/** Create text now timestamp
 * @return {string} - YYYYMMDD-HHMMSS-ssss
 */
function createTimestamp() {
    let now = new Date();
    let dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    let timeStamp = now.toISOString().slice(11, 19).replace(/:/g, '');
    let milliStamp = now.toISOString().slice(20, 24);
    let timestamp = dateStamp + '-' + timeStamp + '-' + milliStamp;
    return timestamp;
}


/** Create text delete timestamp (now + retentionDays)
 * @param {string} retentionDays
 * @return {string} - YYYYMMDD
 */
function calDeleteDate(retentionDays) {
    let date = new Date();
    date.setDate(date.getDate() + Number(retentionDays));
    let dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    return dateStamp;
}


/** Return today date
 * @return {string} - YYYYMMDD
 */
function getTodayDate() {
    let date = new Date();
    let dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    return dateStamp;
}

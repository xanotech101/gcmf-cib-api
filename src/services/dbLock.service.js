const dbLockModel = require('../model/dbLock.model');
const DBLock = require('../model/dbLock.model');

const acquireLock = async (lockName, expiryMinutes = 10) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  try {
    // First check if there's an existing lock that hasn't expired
    const existingLock = await DBLock.findOne({ name: lockName });

    if (existingLock) {
      if (existingLock.expiresAt < now) {
        console.info(
          `Found expired ${lockName}, created at ${existingLock.lockedAt}. Overriding.`
        );
      } else {
        // Lock exists and hasn't expired
        console.info(
          `Lock is held by job ${existingLock.jobId} until ${existingLock.expiresAt}. Cannot acquire lock.`
        );
        return null;
      }
    }

    // Either no lock exists, or it has expired, so we can acquire/update it
    const dbLock = await DBLock.findOneAndUpdate(
      { name: lockName },
      {
        $set: {
          lockedAt: now,
          expiresAt: expiresAt,
        },
      },
      { upsert: true, new: true }
    );

    console.info(`Acquired lock for ${lockName}, expires at ${expiresAt}`);
    return dbLock;
  } catch (error) {
    console.error(`Error acquiring lock: ${error.message}`);
    return null;
  }
};


const releaseLock = async (lockName) => {
  try {
    // release the lock at the end of the process
    const result = await dbLockModel.deleteOne({ name: lockName });
    if (result.deletedCount > 0) {
      console.info(`Released lock for ${lockName}`);
      return true;
    } else {
      console.warn(
        `Could not release lock for ${lockName} - it may have been taken over by another job`
      );
      return false;
    }
  } catch (error) {
    console.error(`Error releasing lock: ${error.message}`);
    // try deleting the lock again
    try {
      const retryResult = await dbLockModel.deleteOne({ name: lockName });
      if (retryResult.deletedCount > 0) {
        console.info(`Released lock for job ${jobId} on retry`);
        return true;
      }
    } catch (retryError) {
      console.error(`Error retrying to release lock: ${retryError.message}`);
        return false;
    }
    
    return false;
  }
};


module.exports = {
  acquireLock,
  releaseLock,
};
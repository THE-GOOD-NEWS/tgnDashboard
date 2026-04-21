// Load environment variables via node flag --env-file=.env.local
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

const runMigration = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB...");

    // 2. Access the database natively to bypass schema restrictions
    const db = mongoose.connection.db;
    
    // If your collection is named differently (e.g. 'formSubmissions'), adjust this name accordingly
    // Mongoose conventionally lowercases custom names that end in 's'
    const collectionName = "formsubmissions";
    const collection = db.collection(collectionName);

    // 3. Find documents that have studentName or studentEmail
    const docsToUpdate = await collection.find({
      $or: [
        { studentName: { $exists: true } },
        { studentEmail: { $exists: true } }
      ]
    }).toArray();

    console.log(`Found ${docsToUpdate.length} documents to update.`);

    if (docsToUpdate.length === 0) {
      console.log("No documents need migration.");
      return;
    }

    // 4. Update the documents: set name/email, and unset studentName/studentEmail
    const bulkOps = docsToUpdate.map((doc) => {
      const setOp = {};
      const unsetOp = {};

      if (doc.studentName && !doc.name) {
        setOp.name = doc.studentName;
      }
      if (doc.studentName !== undefined) {
        unsetOp.studentName = "";
      }

      if (doc.studentEmail && !doc.email) {
        setOp.email = doc.studentEmail;
      }
      if (doc.studentEmail !== undefined) {
        unsetOp.studentEmail = "";
      }

      const updateOp = {};
      if (Object.keys(setOp).length > 0) updateOp.$set = setOp;
      if (Object.keys(unsetOp).length > 0) updateOp.$unset = unsetOp;

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: updateOp
        }
      };
    });

    // 5. Execute bulk operation
    if (bulkOps.length > 0) {
      const result = await collection.bulkWrite(bulkOps);
      console.log(`Migration complete! Modified ${result.modifiedCount} documents.`);
    }

  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    // 6. Clean up the connection
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

runMigration();

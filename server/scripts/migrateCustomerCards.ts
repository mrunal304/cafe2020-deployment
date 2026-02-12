import { MongoQueueEntry, MongoCustomerCard } from "../../shared/mongo-schema";
import mongoose from "mongoose";

export async function migrateCustomerCards() {
  console.log("Starting customer card migration...");
  
  const entries = await MongoQueueEntry.find({}).sort({ bookingDateTime: 1 });
  console.log(`Found ${entries.length} total queue entries`);

  // Group by phone number
  const customersMap = new Map<string, any[]>();
  for (const entry of entries) {
    if (!customersMap.has(entry.phoneNumber)) {
      customersMap.set(entry.phoneNumber, []);
    }
    customersMap.get(entry.phoneNumber)?.push(entry);
  }

  const uniquePhoneNumbers = Array.from(customersMap.keys());
  console.log(`Found ${uniquePhoneNumbers.length} unique customers`);

  let cardsCreated = 0;
  let cardsAlreadyExisted = 0;
  let entriesUpdated = 0;

  for (const phoneNumber of uniquePhoneNumbers) {
    const customerEntries = customersMap.get(phoneNumber) || [];
    
    // Check if card exists
    let customerCard = await MongoCustomerCard.findOne({ phoneNumber });
    
    if (customerCard) {
      cardsAlreadyExisted++;
    } else {
      // Create new card
      const firstEntry = customerEntries[0];
      const lastEntry = customerEntries[customerEntries.length - 1];
      
      const cardId = firstEntry.customerCardId || new mongoose.Types.ObjectId();
      
      customerCard = await MongoCustomerCard.create({
        _id: cardId,
        phoneNumber,
        name: firstEntry.name || "Guest",
        email: null,
        totalVisits: customerEntries.length,
        visits: customerEntries.map(e => e._id),
        firstVisitDate: firstEntry.bookingDateTime || firstEntry.bookingDate,
        lastVisitDate: lastEntry.bookingDateTime || lastEntry.bookingDate,
        createdAt: firstEntry.bookingDateTime || firstEntry.bookingDate,
        updatedAt: new Date(),
      });
      cardsCreated++;
      console.log(`✅ Created card for ${customerCard.name} (${phoneNumber}) - ${customerEntries.length} visits`);
    }

    // Update queue entries
    for (let i = 0; i < customerEntries.length; i++) {
      const entry = customerEntries[i];
      const updates: any = {};
      
      if (!entry.customerCardId) {
        updates.customerCardId = customerCard._id;
      }
      
      if (!entry.visitNumber) {
        updates.visitNumber = i + 1;
      }

      if (Object.keys(updates).length > 0) {
        await MongoQueueEntry.updateOne({ _id: entry._id }, { $set: updates });
        entriesUpdated++;
      }
    }
  }

  console.log("\nMigration complete!");
  console.log(`- Total customers: ${uniquePhoneNumbers.length}`);
  console.log(`- Cards created: ${cardsCreated}`);
  console.log(`- Cards already existed: ${cardsAlreadyExisted}`);
  console.log(`- Queue entries updated: ${entriesUpdated}`);

  return {
    totalCustomers: uniquePhoneNumbers.length,
    cardsCreated,
    cardsAlreadyExisted,
    entriesUpdated
  };
}

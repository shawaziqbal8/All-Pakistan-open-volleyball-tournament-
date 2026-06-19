import { db } from './firebaseService';
import { collection, doc, writeBatch, getDocs, onSnapshot, query, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Team, Match, FanPost, TicketBooking, TournamentNotification } from '../types';
import { INITIAL_TEAMS, INITIAL_MATCHES, INITIAL_FAN_FEED, INITIAL_NOTIFICATIONS } from '../data/tournamentData';

export const initializeFirestoreWithDefaults = async () => {
  try {
    const teamsSnap = await getDocs(collection(db, 'teams'));
    if (teamsSnap.empty) {
      console.log('Seeding initial Teams into Firestore...');
      const batch = writeBatch(db);
      INITIAL_TEAMS.forEach((team) => {
        batch.set(doc(db, 'teams', team.id), team);
      });
      await batch.commit();
    }

    const matchesSnap = await getDocs(collection(db, 'matches'));
    if (matchesSnap.empty) {
      console.log('Seeding initial Matches into Firestore...');
      const batch = writeBatch(db);
      INITIAL_MATCHES.forEach((match) => {
        batch.set(doc(db, 'matches', match.id), match);
      });
      await batch.commit();
    }

    const postsSnap = await getDocs(collection(db, 'posts'));
    if (postsSnap.empty) {
      console.log('Seeding initial Posts into Firestore...');
      const batch = writeBatch(db);
      INITIAL_FAN_FEED.forEach((post) => {
        batch.set(doc(db, 'posts', post.id), post);
      });
      await batch.commit();
    }
  } catch (error) {
    console.warn('Failed to seed default data to Firestore:', error);
  }
};

export const subscribeToCollection = <T>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'desc'
) => {
  let q = collection(db, collectionName) as any;
  if (sortField) {
    q = query(q, orderBy(sortField, sortDirection));
  }
  
  return onSnapshot(
    q,
    (snapshot: any) => {
      const results: T[] = [];
      snapshot.forEach((doc: any) => {
        results.push(doc.data() as T);
      });
      onUpdate(results);
    },
    (error: any) => {
      console.warn(`Error subscribing to ${collectionName}:`, error);
    }
  );
};

export const saveToFirebase = async (collectionName: string, data: any) => {
  if (!data.id) return;
  try {
    await setDoc(doc(db, collectionName, data.id), data, { merge: true });
  } catch (err) {
    console.warn(`Failed to save to ${collectionName}:`, err);
    throw err;
  }
};

export const deleteFromFirebase = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    console.warn(`Failed to delete from ${collectionName}:`, err);
    throw err;
  }
};

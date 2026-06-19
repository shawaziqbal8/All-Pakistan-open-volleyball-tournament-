import { Team, Match, FanPost, TicketBooking, TournamentNotification } from '../types';
import { INITIAL_TEAMS, INITIAL_MATCHES, INITIAL_FAN_FEED, INITIAL_NOTIFICATIONS } from '../data/tournamentData';

// Generate Event Emitters for reactivity without Firebase
const dispatchUpdate = (collectionName: string) => {
  window.dispatchEvent(new Event(`db_update_${collectionName}`));
};

const getLocalData = (collectionName: string) => {
  const data = localStorage.getItem(`db_${collectionName}`);
  return data ? JSON.parse(data) : null;
};

const setLocalData = (collectionName: string, data: any) => {
  localStorage.setItem(`db_${collectionName}`, JSON.stringify(data));
  dispatchUpdate(collectionName);
};

export const initializeFirestoreWithDefaults = async () => {
  try {
    if (!getLocalData('teams')) {
      const teamsObj = INITIAL_TEAMS.reduce((acc, team) => ({ ...acc, [team.id]: team }), {});
      setLocalData('teams', teamsObj);
    }
    if (!getLocalData('matches')) {
      const matchesObj = INITIAL_MATCHES.reduce((acc, match) => ({ ...acc, [match.id]: match }), {});
      setLocalData('matches', matchesObj);
    }
    if (!getLocalData('posts')) {
      const postsObj = INITIAL_FAN_FEED.reduce((acc, post) => ({ ...acc, [post.id]: post }), {});
      setLocalData('posts', postsObj);
    }
  } catch (error) {
    console.warn('Failed to seed local data:', error);
  }
};

export const subscribeToCollection = <T>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'desc'
) => {
  const updateData = () => {
    const dataObj = getLocalData(collectionName) || {};
    let results = Object.values(dataObj) as T[];
    
    if (sortField) {
      results.sort((a: any, b: any) => {
        if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    onUpdate(results);
  };

  // Initial call
  updateData();

  // Listen to updates
  const eventName = `db_update_${collectionName}`;
  window.addEventListener(eventName, updateData);
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener(eventName, updateData);
  };
};

export const saveToFirebase = async (collectionName: string, data: any) => {
  if (!data.id) return;
  try {
    const dataObj = getLocalData(collectionName) || {};
    dataObj[data.id] = { ...dataObj[data.id], ...data };
    setLocalData(collectionName, dataObj);
  } catch (err) {
    console.warn(`Failed to save to ${collectionName}:`, err);
    throw err;
  }
};

export const deleteFromFirebase = async (collectionName: string, id: string) => {
  try {
    const dataObj = getLocalData(collectionName) || {};
    delete dataObj[id];
    setLocalData(collectionName, dataObj);
  } catch (err) {
    console.warn(`Failed to delete from ${collectionName}:`, err);
    throw err;
  }
};

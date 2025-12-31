import { Session } from '../services/sessionService';

interface Database {
  sessions: Session[];
}

const _db: Database = {
  sessions: [],
};

export const getDBInstance = () => {
  return _db;
};

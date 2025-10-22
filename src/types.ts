// Type definitions for GateKeeper application
export type EntryType = 'PERSONNEL' | 'TRUCK' | 'CAR' | 'OTHER';
export type EntryStatus = 'ACTIVE' | 'DELETED';
export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'GATE_OPERATOR';

export interface PayloadBase {
    notes: string;
}

export interface PersonnelPayload extends PayloadBase {
    personnel_name: string;
    id_number: string;
    purpose: string;
}

export interface TruckPayload extends PayloadBase {
    plate_number: string;
    company: string;
    cargo_type: string;
}

export interface CarPayload extends PayloadBase {
    plate_number: string;
    driver_name: string;
}

export interface OtherPayload extends PayloadBase {
    description: string;
    asset_tag: string;
}

export type Payload = PersonnelPayload | TruckPayload | CarPayload | OtherPayload;

export interface Checkpoint {
  checkpoint_id: string;
  name: string;
  location: string;
}

export interface User {
  user_id: string;
  username: string;
  role: UserRole;
  allowed_checkpoints: string[] | null;
  supervisor_id?: string; // For GATE_OPERATOR: which supervisor manages them
  managed_operators?: string[]; // For SUPERVISOR: list of operator user_ids they manage
  last_login?: string;
}

export interface Entry<T extends Payload = Payload> {
    record_id: string;
    checkpoint_id: string;
    entry_type: EntryType;
    logging_user_id: string;
    client_ts: string;

    // Status fields for sync simulation (Server-controlled in final Go API)
    updated_at: string;
    created_at: string;
    status: EntryStatus;

    // Mock flag for visual representation of pending sync
    isPending?: boolean;

    payload: T;
}

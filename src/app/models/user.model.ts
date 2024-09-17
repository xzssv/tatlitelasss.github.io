export interface User {
    id: string;
    name: string;
    email: string;
    isEventOwner: boolean;
    eventId?: string; // Changed back to optional string
}
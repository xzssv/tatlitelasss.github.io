export interface Event {
    id: string;
    ownerId: string;
    name: string;
    eventType: string;
    brideName?: string;
    groomName?: string;
    startDateTime: string;
    endDateTime: string;
    eventCode: string;
    description?: string;
    hideEventName: boolean;
    qrOnly: boolean;
}
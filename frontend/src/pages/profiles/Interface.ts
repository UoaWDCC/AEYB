/**
 * This interface outlines the data for each user
 */

// represent the availability status (and ongoing meeting status) of the user
export enum UserStatus {
    // the color of their status div
    Available = 'green',
    Idle = 'yellow',
    Busy = 'red',
}

// list of roles that the user can have
export enum Roles {
    TeamLeader = 'team',
    Member = 'member',
    BoardLeader = 'board',
}

export interface Profile {
    // assuming that a url is required to fetch google account info
    profilePictureUrl: string;
    name: string;

    status: UserStatus;
    roles: Array<Roles>;
}

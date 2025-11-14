let appUser : AppUserDTO[] = [];

export interface AppUserDTO {
    id: number;
    fullName: string;
    email: string;
    password: string;
    role: string;
    ranksInProgressIds: number[];
    mentorRanksInProgressIds: number[];
    commentIds: number[];
}
export class AppUser {

    static getAll(): Promise<AppUserDTO[]> {
        return Promise.resolve(appUser);
    }

    static getById(id: number): Promise<AppUserDTO> {
        return Promise.resolve(<AppUserDTO>appUser.find(user => user.id === id));
    }

    static add(user: AppUserDTO): Promise<AppUserDTO> {
        const exists = appUser.some(u => u.id === user.id);
        if (!exists) {
            appUser.push(user);
        }
        return Promise.resolve(user);
    }

    static update(user: AppUserDTO): Promise<AppUserDTO | undefined> {
        const index = appUser.findIndex(u => u.id === user.id)
        if (index !== -1) {
            appUser[index] = user;
            return Promise.resolve(user);
        }
        return Promise.resolve(undefined);
    }

    static deleteObject(id: number): void {
        appUser = appUser.filter(user => user.id !== id)
    }
}


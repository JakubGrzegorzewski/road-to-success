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
        window.localStorage.setItem("Users", JSON.stringify(appUser));
        return Promise.resolve(user);
    }

    static update(user: AppUserDTO): Promise<AppUserDTO | undefined> {
        const index = appUser.findIndex(u => u.id === user.id)
        if (index !== -1) {
            appUser[index] = user;
            window.localStorage.setItem("Users", JSON.stringify(appUser));
            return Promise.resolve(user);
        }
        window.localStorage.setItem("Users", JSON.stringify(appUser));
        return Promise.resolve(undefined);
    }

    static deleteObject(id: number): void {
        appUser = appUser.filter(user => user.id !== id)
        window.localStorage.setItem("Users", JSON.stringify(appUser));
    }
}


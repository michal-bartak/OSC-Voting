export namespace main {
	
	export class Song {
	    id: string;
	    title: string;
	    soundCloudUrl: string;
	    currentVote: number;
	
	    static createFrom(source: any = {}) {
	        return new Song(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.soundCloudUrl = source["soundCloudUrl"];
	        this.currentVote = source["currentVote"];
	    }
	}
	export class AppState {
	    songs: Song[];
	    challengeNumber: number;
	
	    static createFrom(source: any = {}) {
	        return new AppState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.songs = this.convertValues(source["songs"], Song);
	        this.challengeNumber = source["challengeNumber"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Config {
	    autoScrollToUnvoted: boolean;
	    email?: string;
	    password?: string;
	    theme?: string;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.autoScrollToUnvoted = source["autoScrollToUnvoted"];
	        this.email = source["email"];
	        this.password = source["password"];
	        this.theme = source["theme"];
	    }
	}

}


// import { User } from "discord.js";
// import SearchResult from "../SearchResult";
// import youtubeDl from "youtube-dl-exec";
// import { SearchResultType } from "../../../utils/constants";

// /**
//  * Searches a generic url.
//  * @param url 
//  * @param options 
//  * @async
//  */
// export async function searchGenericURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
//     let requester = null;

//     if (options) {
//         if (options.requester) requester = options.requester;
//     }

//     let data: any;

//     try {
//         const subprocess = await youtubeDl.exec(
//             url,
//             {
//                 dumpSingleJson: true,
//                 noCheckCertificates: true,
//                 noWarnings: true,
//                 preferFreeFormats: true,
//                 skipDownload: true,
//                 extractAudio: true,
//             }
//         );

//         data = JSON.parse(subprocess.stdout);
//     }
//     catch (error) {
//         return {
//             type: SearchResultType.ERROR,
//             source: AUDIO_MEDIA_SOURCE.GENERIC,
//             items: [],
//             requester: requester
//         } as SearchResult;
//     }

//     const track = null;

//     return {
//         type: SEARCH_RESULT_TYPE.FOUND,
//         source: AUDIO_MEDIA_SOURCE.GENERIC,
//         items: [track],
//         requester: requester
//     } as SearchResult;
// }
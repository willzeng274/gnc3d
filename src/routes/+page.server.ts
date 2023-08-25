// no restrictions for now

// import { redirect } from "@sveltejs/kit";
// import type { PageServerLoad } from "./$types";

// export const load: PageServerLoad = async (req) => {
//   if (req.url.hostname !== "ghostandcakes3d.vercel.app") {
//     return;
//   }
//   const easternDaylightOffset = 4;
//   const utcNow = new Date();
//   const startTime = new Date(utcNow);
//   startTime.setUTCHours(8 + easternDaylightOffset, 5);
//   const endTime = new Date(utcNow);
//   endTime.setUTCHours(10 + easternDaylightOffset, 30);
//   const startTime2 = new Date(utcNow);
//   startTime2.setUTCHours(11 + easternDaylightOffset, 20);
//   const endTime2 = new Date(utcNow);
//   endTime2.setUTCHours(13 + easternDaylightOffset, 55);
//   if (!(startTime <= utcNow && utcNow <= endTime) || !(startTime2 <= utcNow && utcNow <= endTime2)) {
//     throw redirect(302, "/no");
//   }
//   return;
// }
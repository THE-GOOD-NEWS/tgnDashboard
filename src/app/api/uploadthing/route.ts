import { createRouteHandler } from "uploadthing/next";
 
import { ourFileRouter } from "./core";
import { UTApi } from "uploadthing/server";
 
// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
 
  // Apply an (optional) custom config:
  // config: { ... },
});


export async function DELETE(request: Request) {
  console.log('herezzz')
  const data = await request.json();
  console.log(data)
  const newUrl = data.url.substring(data.url.lastIndexOf("/") + 1);
  console.log(newUrl)
  const utapi = new UTApi();
  //  --- i used this inside route file in uploadthing folder
  await utapi.deleteFiles(newUrl);

  return Response.json({ message: "ok" ,status:200});
}

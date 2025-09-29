"use strict";(()=>{var a={};a.id=1573,a.ids=[1573],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{a.exports=require("node:process")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},7066:a=>{a.exports=require("node:tty")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11723:a=>{a.exports=require("querystring")},12412:a=>{a.exports=require("assert")},12909:(a,b,c)=>{c.d(b,{N:()=>g});var d=c(16467),e=c(13581),f=c(31183);let g={adapter:(0,d.y)(f.z),providers:[(0,e.A)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(a){try{if(console.log("\uD83D\uDD10 Auth attempt for:",a?.email),!a?.email||!a?.password)return console.log("❌ Missing credentials"),null;console.log("\uD83D\uDCCA Looking up user in database...");let b=await f.z.user.findUnique({where:{email:a.email}});if(!b)return console.log("❌ User not found"),null;if(!b.isActive)return console.log("❌ User is not active"),null;if(!b.password)return console.log("❌ User has no password set"),null;console.log("\uD83D\uDD0D Verifying password...");let d=await c.e(5663).then(c.bind(c,85663));if(!await d.compare(a.password,b.password))return console.log("❌ Invalid password"),null;return console.log("✅ Authentication successful"),{id:b.id,email:b.email,name:b.name,image:b.image,role:b.role,department:b.department}}catch(a){return console.error("\uD83D\uDEA8 Auth error:",a),null}}})],session:{strategy:"jwt"},callbacks:{jwt:async({token:a,user:b})=>(b&&(a.role=b.role,a.department=b.department),a),session:async({session:a,token:b})=>(b&&(a.user.id=b.sub,a.user.role=b.role,a.user.department=b.department),a)},pages:{signIn:"/auth/signin",error:"/auth/error"}}},16698:a=>{a.exports=require("node:async_hooks")},21111:(a,b,c)=>{c.d(b,{ZM:()=>h});var d=c(49526);let e=null,f=process.env.EMAIL_FROM||"LSVR Inventory <inventory@lightsailvr.com>",g=process.env.EMAIL_REPLY_TO||"support@lightsailvr.com";async function h({to:a,subject:b,html:c,text:h,replyTo:i=g}){try{if(!process.env.SMTP_USER||!process.env.SMTP_PASSWORD)return console.log("SMTP not configured. Skipping email send."),console.log("To enable emails, configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in .env"),{success:!1,error:"SMTP not configured"};let g=(e||(e=d.createTransport({host:process.env.SMTP_HOST||"smtp.gmail.com",port:parseInt(process.env.SMTP_PORT||"587"),secure:"true"===process.env.SMTP_SECURE,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD},tls:{rejectUnauthorized:!0}})),e),j=await g.sendMail({from:f,to:Array.isArray(a)?a.join(", "):a,subject:b,text:h||"This email requires HTML support to be viewed properly.",html:c,replyTo:i});return console.log("Email sent successfully:",j.messageId),{success:!0,data:{id:j.messageId}}}catch(a){return console.error("Error sending email:",a),{success:!1,error:a instanceof Error?a.message:"Failed to send email"}}}},21820:a=>{a.exports=require("os")},27910:a=>{a.exports=require("stream")},28354:a=>{a.exports=require("util")},29021:a=>{a.exports=require("fs")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{a.exports=require("node:child_process")},33873:a=>{a.exports=require("path")},34631:a=>{a.exports=require("tls")},37366:a=>{a.exports=require("dns")},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{a.exports=require("node:os")},51455:a=>{a.exports=require("node:fs/promises")},55511:a=>{a.exports=require("crypto")},55591:a=>{a.exports=require("https")},57975:a=>{a.exports=require("node:util")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{a.exports=require("node:fs")},74075:a=>{a.exports=require("zlib")},76760:a=>{a.exports=require("node:path")},77598:a=>{a.exports=require("node:crypto")},78474:a=>{a.exports=require("node:events")},78642:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>E,patchFetch:()=>D,routeModule:()=>z,serverHooks:()=>C,workAsyncStorage:()=>A,workUnitAsyncStorage:()=>B});var d={};c.r(d),c.d(d,{GET:()=>y});var e=c(96559),f=c(48088),g=c(37719),h=c(26191),i=c(81289),j=c(261),k=c(92603),l=c(39893),m=c(14823),n=c(47220),o=c(66946),p=c(47912),q=c(99786),r=c(46143),s=c(86439),t=c(43365),u=c(32190),v=c(95699),w=c(19854),x=c(12909);async function y(a){try{let a=await (0,w.getServerSession)(x.N);if(!a?.user?.email)return u.NextResponse.json({error:"Not authenticated"},{status:401});let b=await (0,v.t)({transactionType:"CHECKOUT",userName:a.user.name||a.user.email,userEmail:a.user.email,assets:[{id:"test-1",name:"Sony FX6 Camera",assetNumber:"CAM-001",serialNumber:"SN123456",category:"CAMERA",currentValue:5999,imageUrl:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200",notes:"Test checkout - Please handle with care",returnDate:new Date(Date.now()+6048e5).toISOString()},{id:"test-2",name:"Zoom H6 Audio Recorder",assetNumber:"AUD-015",serialNumber:"ZH6789",category:"AUDIO",currentValue:349,notes:"Includes windscreen and batteries",returnDate:null}],transactionDate:new Date});if(b.success)return u.NextResponse.json({success:!0,message:`Test email sent successfully to ${a.user.email}!`,details:b.data});return u.NextResponse.json({success:!1,error:"Failed to send email",details:b.error},{status:500})}catch(a){return console.error("Test email error:",a),u.NextResponse.json({success:!1,error:"Email test failed",details:a instanceof Error?a.message:a},{status:500})}}let z=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/test-email/route",pathname:"/api/test-email",filename:"route",bundlePath:"app/api/test-email/route"},distDir:".next-prod",projectDir:"",resolvedPagePath:"/home/apps/lsvr-apps/lsvr-inventory/src/app/api/test-email/route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:A,workUnitAsyncStorage:B,serverHooks:C}=z;function D(){return(0,g.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:B})}async function E(a,b,c){var d;let e="/api/test-email/route";"/index"===e&&(e="/");let g=await z.prepare(a,b,{srcPage:e,multiZoneDraftMode:"false"});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[E]||y.routes[D]);if(F&&!x){let a=!!y.routes[D],b=y.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||z.isDev||x||(G="/index"===(G=D)?"/":G);let H=!0===z.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{dynamicIO:!!w.experimental.dynamicIO,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>z.onRequestError(a,b,d,A)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>z.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await z.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},A),b}},l=await z.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(L||b instanceof s.NoFallbackError||await z.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},79428:a=>{a.exports=require("buffer")},79551:a=>{a.exports=require("url")},79646:a=>{a.exports=require("child_process")},81630:a=>{a.exports=require("http")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},91645:a=>{a.exports=require("net")},94735:a=>{a.exports=require("events")},95699:(a,b,c)=>{c.d(b,{t:()=>f});var d=c(22539),e=c(21111);async function f({transactionType:a,userName:b,userEmail:c,assets:f,transactionDate:g=new Date}){try{let h=f.reduce((a,b)=>{let c=b.currentValue||b.purchasePrice||0;return a+c},0),i=function({transactionType:a,userName:b,userEmail:c,assets:e,transactionDate:f,totalValue:g}){let h="CHECKOUT"===a,i=e.map(a=>{let b=a.currentValue||a.purchasePrice;return`
      <tr style="border-bottom: 1px solid #e6ebf1;">
        <td style="padding: 16px; vertical-align: top;">
          <div style="display: flex; align-items: flex-start;">
            ${a.imageUrl?`
              <img src="${a.imageUrl}" alt="${a.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 16px;">
            `:`
              <div style="width: 60px; height: 60px; background: #f6f9fc; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-size: 24px;">📦</div>
            `}
            <div>
              <h4 style="margin: 0 0 8px 0; color: #1A2332; font-size: 16px; font-weight: 600;">${a.name}</h4>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Category: ${a.category.replace(/_/g," ")}</p>
              ${a.assetNumber?`<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Asset #: ${a.assetNumber}</p>`:""}
              ${a.serialNumber?`<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Serial #: ${a.serialNumber}</p>`:""}
              ${b?`<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Value: $${b.toLocaleString()}</p>`:""}
              ${h&&a.returnDate?`<p style="margin: 4px 0; color: #F54F29; font-size: 14px; font-weight: 500;">Return Date: ${(0,d.GP)(new Date(a.returnDate),"PPP")}</p>`:""}
              ${h&&!a.returnDate?'<p style="margin: 4px 0; color: #F54F29; font-size: 14px; font-weight: 500;">Return Date: No return date set</p>':""}
              ${a.notes?`<p style="margin: 8px 0 0; color: #6b7280; font-size: 13px; font-style: italic;">Notes: ${a.notes}</p>`:""}
            </div>
          </div>
        </td>
      </tr>
    `}).join("");return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${h?"Checkout":"Check-in"} Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-top: 32px; margin-bottom: 32px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #1A2332; padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #F54F29; font-size: 24px; font-weight: 600; letter-spacing: 2px;">LSVR WAREHOUSE</h1>
          <p style="margin: 8px 0 0; color: #C5CAD6; font-size: 14px;">Inventory Management System</p>
        </div>

        <!-- Status Badge -->
        <div style="padding: 24px 32px; text-align: center;">
          <div style="display: inline-block; background-color: ${h?"#FEF3C7":"#D1FAE5"}; color: ${h?"#92400E":"#065F46"}; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            ${h?"\uD83D\uDCE6 CHECKOUT CONFIRMATION":"✅ CHECK-IN CONFIRMATION"}
          </div>
        </div>

        <!-- Transaction Info -->
        <div style="padding: 0 32px;">
          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;"><strong>User:</strong></td>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;">${b}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;">${c}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;">${(0,d.GP)(f,"PPP p")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;"><strong>Total Value:</strong></td>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;">$${g.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 24px 32px;">

        <!-- Assets List -->
        <div style="padding: 0 32px;">
          <h2 style="color: #1A2332; font-size: 18px; font-weight: 600; margin: 0 0 16px;">
            ${h?"Assets Checked Out":"Assets Checked In"}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${i}
          </table>
        </div>

        ${h?`
          <div style="background-color: #FEF3C7; padding: 24px 32px; margin: 24px 32px; border-radius: 8px;">
            <h3 style="color: #92400E; font-size: 16px; font-weight: 600; margin: 0 0 12px;">⚠️ Important Reminders</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400E; font-size: 14px;">
              <li style="margin: 4px 0;">Please handle all equipment with care</li>
              <li style="margin: 4px 0;">Report any damage or issues immediately</li>
              <li style="margin: 4px 0;">Return items by their scheduled return date</li>
              <li style="margin: 4px 0;">Keep this email for your records</li>
            </ul>
          </div>
        `:""}

        <!-- Footer -->
        <div style="padding: 32px; text-align: center; background-color: #f6f9fc;">
          <p style="margin: 4px 0; color: #8898aa; font-size: 12px;">
            This is an automated email from the LSVR Inventory Management System.
          </p>
          <p style="margin: 4px 0; color: #8898aa; font-size: 12px;">
            If you have any questions, please contact <a href="mailto:support@lightsailvr.com" style="color: #F54F29; text-decoration: none;">support@lightsailvr.com</a>
          </p>
          <p style="margin: 4px 0; color: #8898aa; font-size: 12px;">
            \xa9 ${new Date().getFullYear()} LightSail VR. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `}({transactionType:a,userName:b,userEmail:c,assets:f,transactionDate:g,totalValue:h}),j=function({transactionType:a,userName:b,userEmail:c,assets:d,transactionDate:e,totalValue:f}){let g="CHECKOUT"===a,h=`LSVR WAREHOUSE - Inventory Management System

`;return h+=`${g?"CHECKOUT":"CHECK-IN"} CONFIRMATION

User: ${b}
Email: ${c}
Date: ${e.toLocaleString()}
Total Value: $${f.toLocaleString()}

Assets ${g?"checked out":"checked in"}:
${"=".repeat(50)}

`,d.forEach((a,b)=>{let c=a.currentValue||a.purchasePrice;h+=`${b+1}. ${a.name}
   Category: ${a.category.replace(/_/g," ")}
`,a.assetNumber&&(h+=`   Asset #: ${a.assetNumber}
`),a.serialNumber&&(h+=`   Serial #: ${a.serialNumber}
`),c&&(h+=`   Value: $${c.toLocaleString()}
`),g&&a.returnDate?h+=`   Return Date: ${new Date(a.returnDate).toLocaleDateString()}
`:g&&(h+=`   Return Date: No return date set
`),a.notes&&(h+=`   Notes: ${a.notes}
`),h+="\n"}),g&&(h+=`Important Reminders:
• Please handle all equipment with care
• Report any damage or issues immediately
• Return items by their scheduled return date
• Keep this email for your records

`),h+=`${"=".repeat(50)}
This is an automated email from the LSVR Inventory Management System.
If you have any questions, please contact support@lightsailvr.com
\xa9 ${new Date().getFullYear()} LightSail VR. All rights reserved.`}({transactionType:a,userName:b,userEmail:c,assets:f,transactionDate:g,totalValue:h});return await (0,e.ZM)({to:c,subject:`${"CHECKOUT"===a?"Checkout":"Check-in"} Confirmation - LSVR Inventory`,html:i,text:j})}catch(a){return console.error("Error sending transaction email:",a),{success:!1,error:a}}}}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[2073,5491,2190,9526,2539,8275],()=>b(b.s=78642));module.exports=c})();
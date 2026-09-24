"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { repo, getSession } from "@/lib/data";
import { isStaff } from "@/lib/auth";
import { locales } from "@/i18n/config";
import { CHANNELS, CONTENT_KINDS, FUNNEL_STAGES, KEY_PATTERN, validateBody } from "@/lib/sales/content";

export type SalesAdminState = { ok?: boolean; error?: string };
async function session(){const s=await getSession();if(!isStaff(s))throw new Error("Forbidden");return s!}
const done=()=>revalidatePath("/[locale]/admin","layout");

export async function saveSalesContent(_:SalesAdminState,f:FormData):Promise<SalesAdminState>{try{const s=await session();const d=z.object({id:z.string().optional(),kind:z.enum(CONTENT_KINDS),key:z.string().regex(KEY_PATTERN),locale:z.enum(locales),title:z.string().trim().min(1).max(200),summary:z.string().trim().max(1000).optional(),targetKey:z.string().trim().max(80).optional(),channel:z.enum(CHANNELS).or(z.literal("")).optional(),stage:z.enum(FUNNEL_STAGES).or(z.literal("")).optional(),tags:z.string().max(1000).optional(),sort:z.coerce.number().int().min(0).max(10000),body:z.string().min(2).max(100000)}).parse(Object.fromEntries(f));let raw:unknown;try{raw=JSON.parse(d.body)}catch{return{error:"invalid_json"}}const checked=validateBody(d.kind,raw);if(!checked.ok)return{error:`invalid_body:${checked.errors.join(",")}`};await repo().adminSaveSalesContent(s,d.id||null,{kind:d.kind,key:d.key,locale:d.locale,title:d.title,summary:d.summary||null,targetKey:d.targetKey||null,channel:d.channel||null,stage:d.stage||null,tags:(d.tags??"").split(",").map(x=>x.trim()).filter(Boolean),sort:d.sort,body:checked.body});done();return{ok:true}}catch(e){return{error:e instanceof Error?e.message:"error"}}}
export async function salesContentAction(f:FormData){const s=await session();const id=z.string().min(1).max(100).parse(f.get("id"));const op=z.enum(["publish","archive","version","delete"]).parse(f.get("op"));if(op==="publish"||op==="archive")await repo().adminSetSalesContentStatus(s,id,op==="publish"?"active":"archived",String(f.get("reason")??"").trim()||null);else if(op==="version")await repo().adminNewSalesContentVersion(s,id,null);else await repo().adminDeleteSalesContentDraft(s,id);done()}
export async function setSalesPageActive(f:FormData){const s=await session();await repo().adminSetSalesPageActive(s,z.string().min(1).parse(f.get("id")),f.get("active")==="true",z.string().trim().min(3).max(500).parse(f.get("reason")));done()}

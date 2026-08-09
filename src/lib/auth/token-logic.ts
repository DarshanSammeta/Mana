import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { AUTH_CONFIG } from "@/config/auth";
import { randomUUID } from "crypto";


const ACCESS_SECRET = new TextEncoder()
.encode(AUTH_CONFIG.jwtAccessSecret);

const REFRESH_SECRET = new TextEncoder()
.encode(AUTH_CONFIG.jwtRefreshSecret);



export interface AccessTokenPayload extends JWTPayload {
 userId:string;
 role:string;
 sessionId:string;
 id:string;
 verificationStatus?:string | null;
}



export interface RefreshTokenPayload extends JWTPayload {
 userId:string;
 sessionId:string;
 role:string;
}



export interface SessionData {
 userId: string;
 role: string;
 verificationStatus?: string | null;
}

export const signAccessToken = async(
payload:AccessTokenPayload
)=>{


return await new SignJWT({
 ...payload,
 id:payload.id || payload.userId
})

.setProtectedHeader({
 alg:"HS256",
 typ:"JWT"
})

.setIssuer("mana-events")

.setAudience("mana-events-admin")

.setIssuedAt()

.setExpirationTime(
AUTH_CONFIG.accessTokenExpiresIn
)

.sign(ACCESS_SECRET);


};



export const signRefreshToken = async(
payload:RefreshTokenPayload
)=>{


return await new SignJWT({
 ...payload,
 jti:randomUUID()
})

.setProtectedHeader({
 alg:"HS256",
 typ:"JWT"
})

.setIssuer("mana-events")

.setAudience("mana-events-refresh")

.setIssuedAt()

.setExpirationTime(
AUTH_CONFIG.refreshTokenExpiresIn
)

.sign(REFRESH_SECRET);


};



export const verifyAccessToken = async(
token:string
)=>{

try{

const {payload}=await jwtVerify(
token,
ACCESS_SECRET,
{
algorithms:["HS256"],
issuer:"mana-events",
audience:"mana-events-admin"
}
);


return payload as AccessTokenPayload;


}catch(error){

console.error(
"ACCESS_TOKEN_VERIFY_FAILED"
);

return null;

}

};




export const verifyRefreshToken = async(
token:string
)=>{

try{

const {payload}=await jwtVerify(
token,
REFRESH_SECRET,
{
algorithms:["HS256"],
issuer:"mana-events",
audience:"mana-events-refresh"
}
);


return payload as RefreshTokenPayload;


}catch(error){

console.error(
"REFRESH_TOKEN_VERIFY_FAILED"
);

return null;

}

};
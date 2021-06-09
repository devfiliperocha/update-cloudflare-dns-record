const axios = require('axios')
const { cloudflareDNSId, cloudflareToken, cloudflareZoneId, urlDNSRecord, interval } = require('./config.json')

const getIp = async () => {
    try{
        const response = await axios.get("http://checkip.dyndns.org/")
        const ip = String(response.data).replace(/[^0-9.]/g,'').trim()
        console.log("[IP] => "+ip)
        return ip
    }catch(err){
        console.log("[ERR] Getting IP")
        console.log(err)
    }
}

const getDnsRecordData = async () => {
    try{
        const response = await axios({
            baseURL: `https://api.cloudflare.com/client/v4/zones/${cloudflareZoneId}/dns_records/${cloudflareDNSId}`,
            method: 'get',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cloudflareToken}`,
            }
        })
        if(response.data.success){
            console.log("[DNS-RECORD] => "+response.data.result.content)
            return response.data.result
        }else{
            throw new Error(JSON.stringify(response.data.errors))
        }
    }catch(err){
        console.log("[ERR] Updating DNS")
        console.log(err)
    }
}

const updateDnsRecord = async (ip) => {
    try{
        const response = await axios({
            baseURL: `https://api.cloudflare.com/client/v4/zones/${cloudflareZoneId}/dns_records/${cloudflareDNSId}`,
            method: 'put',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cloudflareToken}`,
            },
            data: {
                "content": ip,
                "name": urlDNSRecord,
                "ttl":1,
                "type":"A"
            }
        })
        if(response.data.success){
            console.log("[DNS-UPDATED]")
            return response.data.result
        }else{
            throw new Error(JSON.stringify(response.data.errors))
        }
    }catch(err){
        console.log("[ERR] Updating DNS")
        console.log(err)
    }
}

setInterval(async () => {
    return getIp().then(ip=>{
        return getDnsRecordData().then(data=>{
            if(ip != data.content){
                console.log(`[DNS-NEED-UPDATE] => OLD: ${data.content} NEW: ${ip} `)
                return updateDnsRecord(ip).then(r=>{
                    console.log("[DNS-UPDATED]")
                })
            }else{
                console.log("[DNS-ALREADY-UPDATED]")
                return
            }
        })
    })
}, interval)
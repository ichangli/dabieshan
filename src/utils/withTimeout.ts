export function withTimeout<T>(promise:Promise<T>,ms:number):Promise<T>{
    let timeId: ReturnType<typeof setTimeout>

    const timeoutPromise = new Promise<never>((_,reject)=>{
        timeId = setTimeout(()=>{
            reject(new Error('等待超时'))
        },ms)
    })

    return Promise.race([promise,timeoutPromise]).finally(()=>{
        clearTimeout(timeId)
    })
}
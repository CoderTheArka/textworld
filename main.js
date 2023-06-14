let APP_ID = "d284e73170f54d6da4780484543feb23";

let token = null;
let uid = String(Math.floor(Math.random() * 1000000));

let clinet;
let channel;

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room')

if(!roomId){
    window.location = 'lobby.html'
}

let localStream;
let remoteStream;
let peerConnection;

const servers ={
    iceServers:[
        {
            urls:['stun:stun1.1,google.com:19302' , 'stun:stun2.1.google.com:19302']
        }
    ]
}

let init = async () => {
    clinet = await AgoraRTM.createInstance(APP_ID);
   await clinet.login({uid , token})

  channel = clinet.createChannel(roomId)
  await channel.join();

  channel.on('MemberJoined' , handleUserjoined);
  channel.on('MemberLeft' , handleUserLeft)

  clinet.on('MessageFromPeer' , handleMessageFromPeer);


localStream = await navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
});
document.getElementById('user-1').srcObject = localStream;

}

let handleUserLeft = (MemberId) => {
    document.getElementById('user-2').style.display = 'none';
}

let handleMessageFromPeer = async (message , MemberId) =>{
   message = JSON.parse(message.text)
   console.log('Message: ',message)
   
   if(message.type === 'offer'){
    createAnswer(MemberId, message.offer)
   }

   if(message.type === 'answer'){
    addAnswer(message.answer)
   }
   if(message.type === 'candidate'){
    addAnswer(message.answer)
    if(peerConnection){
        peerConnection.addIceCandidate(message.candidate)
    }
   }

}

let handleUserjoined = async(MemberId) => {
    console.log('A new user joined the channel:- ', MemberId);
    createOffer(MemberId);
}
let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers)
remoteStream = new MediaStream()
document.getElementById('user-2').srcObject = remoteStream
document.getElementById('user-2').style.display = 'block';

if(!localStream ){
    localStream = await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:false
    });
    document.getElementById('user-1').srcObject = localStream;
}

localStream.getTracks().forEach((track) => {
 peerConnection.addTrack(track , localStream)
});

peerConnection.ontrack = (event)=> {
    event.streams[0].getTracks().forEach((track) =>{
    remoteStream.addTrack(track);
    })
}

peerConnection.onicecandidate = async (event) =>{
    if(event.candidate){
        clinet.sendMessageToPeer({text:JSON.stringify({'type':'candidate' , 'candidate':event.candidate})}, MemberId)

    }
}
}

let createOffer = async (MemberId) =>{
    await createPeerConnection(MemberId)
peerConnection = new RTCPeerConnection(servers)
remoteStream = new MediaStream()
document.getElementById('user-2').srcObject = remoteStream

if(!localStream ){
    localStream = await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:false
    });
    document.getElementById('user-1').srcObject = localStream;
}

localStream.getTracks().forEach((track) => {
 peerConnection.addTrack(track , localStream)
});

peerConnection.ontrack = (event)=> {
    event.streams[0].getTracks().forEach((track) =>{
    remoteStream.addTrack(track);
    })
}

peerConnection.onicecandidate = async (event) =>{
    if(event.candidate){
        clinet.sendMessageToPeer({text:JSON.stringify({'type':'candidate' , 'candidate':event.candidate})}, MemberId)

    }
}

let offer = await peerConnection.createOffer()
await peerConnection.setLocalDescription(offer);

clinet.sendMessageToPeer({text:JSON.stringify({'type':'offer' , 'offer':offer})}, MemberId)
}

let createAnswer = async (MemberId, offer)=>{
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)
    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer)
    clinet.sendMessageToPeer({text:JSON.stringify({'type':'answer' , 'answer':answer})}, MemberId)
}

let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

let leaveChannel = async () =>{
    await channel.leave();
    await clinet.logout();
}
function ggh(){
        let videoTrack = localStream.getTracks().find(track => track.kind === 'video');
        if(videoTrack.enabled){
           videoTrack.enabled = false
           document.getElementById('camera-btn').style.backgroundColor = 'red'
        }else{
            videoTrack.enabled = true
            document.getElementById('camera-btn').style.backgroundColor = 'green'
        }
}
function ggh1(){
    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
    if(audioTrack.enabled){
       audioTrack.enabled = false
       document.getElementById('mic-btn').style.backgroundColor = 'red'
    }else{
        audioTrack.enabled = true
        document.getElementById('mic-btn').style.backgroundColor = 'green'
    }
}




window.addEventListener('beforeunload' , leaveChannel);

init();
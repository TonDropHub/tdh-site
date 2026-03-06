(function(){

const API = "/api/comments"

const banned = [
"fuck","shit","bitch","asshole","bastard",
"сука","блять","хуй","пизда"
]

function hasLink(text){
return /(http|https|www\.)/i.test(text)
}

function hasBadWords(text){
const t = text.toLowerCase()
return banned.some(w => t.includes(w))
}

function articleSlug(){
return window.location.pathname
}

async function loadComments(){

const slug = articleSlug()

const res = await fetch(API + "?slug=" + encodeURIComponent(slug))
const comments = await res.json()

const list = document.getElementById("comments-list")

if(!comments.length){
list.innerHTML = "<p>No comments yet.</p>"
return
}

list.innerHTML = comments.map(c => `
<div class="comment">
<div class="comment-author">${escapeHtml(c.author)}</div>
<div class="comment-text">${escapeHtml(c.comment)}</div>
</div>
`).join("")
}

function escapeHtml(text){
return text
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
}

async function submitComment(){

const author = document.getElementById("comment-name").value.trim()
const comment = document.getElementById("comment-text").value.trim()

if(!author || !comment){
alert("Fill all fields")
return
}

if(hasLink(comment)){
alert("Links are not allowed")
return
}

if(hasBadWords(comment)){
alert("Bad language not allowed")
return
}

const res = await fetch(API,{
method:"POST",
headers:{
"content-type":"application/json"
},
body:JSON.stringify({
slug:articleSlug(),
author,
comment
})
})

if(res.ok){

document.getElementById("comment-text").value=""

loadComments()

}else{
alert("Error posting comment")
}

}

function render(){

const container = document.createElement("div")

container.className = "comments"

container.innerHTML = `
<h3>Comments</h3>

<div id="comments-list"></div>

<div class="comment-form">

<input id="comment-name" placeholder="Your name">

<textarea id="comment-text" placeholder="Write a comment"></textarea>

<button id="comment-submit">Post Comment</button>

</div>
`

document.querySelector("article").appendChild(container)

document
.getElementById("comment-submit")
.addEventListener("click",submitComment)

loadComments()

}

document.addEventListener("DOMContentLoaded",render)

})()

let currentSong = new Audio();
const play = document.getElementById("play");
let songs;
let currFolder;

function secondsToMinutes(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    // seconds = seconds - (minutes * 60);
    const remainingseconds = Math.floor(seconds % 60);

    const formattedminutes = String(minutes).padStart(2, '0');
    const formattedseconds = String(remainingseconds).padStart(2, '0');
    return `${formattedminutes}:${formattedseconds}`;
}

async function getSongs(folder) {
    currFolder = folder;

    let info = {};
    let res = await fetch(`/${folder}/info.json`);
    info = await res.json();

    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    songs = [];
    for (let anchor of anchors) {
        let href = anchor.getAttribute("href");
        if (href && href.endsWith(".mp3")) {
            songs.push(href);
        }
    }
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML +
            `<li><img src="img/music.svg" alt="">
            <div class="info">
                <div>${decodeURIComponent(song.split("/").slice(-1))}</div>
                <div>${decodeURIComponent(info.author || "Unknown")}</div>
            </div>
            <img src="img/play.svg" class="logo-size-1" alt=""> 
        </li>`;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            play.src = "img/pause.svg";
        })
    });
}


const playMusic = (track) => {
    // const decodedTrack = decodeURIComponent(track);
    // const audio = new Audio("songs/" + decodedTrack);

    // Using trim()
    // var audio = new Audio("songs/" + track);
    // audio.play();

    // currentSong.src = `/${currFolder}/` + track;
    currentSong.src = `${track.includes(currFolder) ? '' : `/${currFolder}/`}${track}`;
    currentSong.play();
    document.querySelector(".songInfo").innerHTML = decodeURIComponent(track.split(".mp3")[0]);
    document.querySelector(".songTime").innerHTML = "00:00/00:00";
}

// async function displayAlbums() {
//     let a = await fetch(`/songs/`);
//     let response = await a.text();
//     let div = document.createElement("div");
//     div.innerHTML = response;
//     let anch = div.getElementsByTagName("a")
//     Array.from(anch).forEach(e=>{
//         if(e.href.includes("/songs/")) {
//             console.log(decodeURIComponent(e.href.split("/").slice(-1)));
//         }
//     })
// }

async function displayAlbums() {
    try {
        let response = await fetch(`/songs/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        let albumLinks = Array.from(anchors).filter(a => a.href.includes("/songs/"));
        const cardContainer = document.querySelector(".card-container");
        cardContainer.innerHTML = "";
        for (let link of albumLinks) {
            const folderName = decodeURIComponent(link.href.split("/").filter(Boolean).pop());
            try {
                const infoRes = await fetch(`/songs/${folderName}/info.json`);
                const info = await infoRes.json();
                const card = document.createElement("div");
                card.className = "card rounded bg-242424";
                const circleIcon = document.createElement("div");
                circleIcon.className = "circle-icon";
                circleIcon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                        <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" fill="black" />
                    </svg>
                `;
                card.appendChild(circleIcon);
                const img = document.createElement("img");
                img.src = `playlistImg/${folderName}.jpg`;
                img.alt = info.album || folderName;
                card.appendChild(img);
                const h4 = document.createElement("h4");
                h4.innerText = info.album || folderName;
                card.appendChild(h4);
                const p = document.createElement("p");
                p.innerText = info.author || "Unknown";
                card.appendChild(p);
                card.dataset.folder = folderName;
                card.addEventListener("click", async (item) => {
                    // console.log(item.currentTarget.dataset);
                    songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                });

                cardContainer.appendChild(card);
            } catch (err) {
                console.warn(`Couldn't load info.json for album: ${folderName}`, err);
            }
        }
    } catch (error) {
        console.error("Error fetching albums:", error);
    }
}

async function main() {
    await getSongs("songs/- (Minus)");
    displayAlbums();

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") e.preventDefault();
        if (!currentSong.src) return;
        if (e.code === "Space" || e.code === "MediaPlayPause") play.click();
        if (e.code === "ArrowLeft") currentSong.currentTime = Math.max(0, currentSong.currentTime - 5);
        if (e.code === "ArrowRight") currentSong.currentTime = Math.min(currentSong.duration, currentSong.currentTime + 5);
    })

    play.addEventListener("click", () => {
        if (!currentSong.src) return;
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        // console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songTime").innerHTML = `${secondsToMinutes(currentSong.currentTime)} / ${secondsToMinutes(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime * 100 / currentSong.duration) + "%";
    });

    // Doesn't works because of circle
    // document.querySelector(".seekbar").addEventListener("click", e=> {
    //     document.querySelector(".circle").style.left = (e.offsetX/e.target.getBoundingClientRect().width) * 100 + "%";
    // })

    document.querySelector(".seekbar").addEventListener("click", e => {
        if (!currentSong.src) return;
        const seekbar = document.querySelector(".seekbar");
        const circle = document.querySelector(".seekbar .circle");
        const rect = seekbar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = (clickX / rect.width) * 100;
        const clampedPercentage = Math.max(0, Math.min(percentage, 100));
        circle.style.left = clampedPercentage + "%";
        currentSong.currentTime = (currentSong.duration * percentage) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".home").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    next.addEventListener("click", () => {
        if (!songs || !currentSong.src) return;
        let currentTrack = currentSong.src.split("/").slice(-1)[0];
        let index = songs.indexOf(currentTrack);
        if (index !== -1) {
            playMusic(songs[(index + 1) % songs.length]);
        }
    });

    prev.addEventListener("click", () => {
        if (!songs || !currentSong.src) return;
        let currentTrack = currentSong.src.split("/").slice(-1)[0];
        let index = songs.indexOf(currentTrack);
        if (index !== -1) {
            playMusic(songs[(index - 1 + songs.length) % songs.length]);
        }
    });

    volicon.addEventListener("click", () => {
        if (!currentSong.src) volicon.src = "img/mute.svg";
        currentSong.muted = !currentSong.muted;
        if (currentSong.muted) volicon.src = "img/mute.svg";
        else volicon.src = "img/volume.svg";
    });

    document.querySelector(".volume").addEventListener("click", e => {
        if (!currentSong.src) return;
        const volume = document.querySelector(".volume");
        const volcircle = document.querySelector(".volume .volcircle");
        const rect = volume.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = (clickX / rect.width) * 100;
        const clampedPercentage = Math.max(0, Math.min(percentage, 100));
        volcircle.style.left = clampedPercentage + "%";
        currentSong.volume = clampedPercentage / 100;
        console.log(currentSong.volume);
    });
}

main();
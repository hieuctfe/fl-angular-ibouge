function getPreviousLinkURL(o) {
    while (o = o.previousSibling) {
        if (o.tagName == "A" && o.href) {
            return o.href;
        }
    }
}

function getPreviousCardTitle(o) {
    while (o = o.previousSibling) {
        // Nest 1 deep, all we need for blog.html
        for (let i = 0; i < o.childNodes.length; i++) {
            co = o.childNodes[i];
            if (co.className == "card-title") {
                return co.innerText;
            }
        }
    }
}

function sharePreviousLink(o, platform) {
    let url = getPreviousLinkURL(o);

    if (!url) return;
    
    if (platform == "linkedin") {
        document.location = "https://www.linkedin.com/shareArticle?mini=true&url=" + encodeURIComponent(url);
    } else if (platform == "facebook") {
        document.location = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
    } else if (platform == "twitter") {
        let title = getPreviousCardTitle(o);
        let tweet = title + " " + url;
        document.location = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweet);
    }
}

function shareBlogLandingPage(o, platform) {
    let url = document.location.href;
    
    if (!url) return;

    if (url.includes('?')) {
        url += '&v=2&from=';
    } else {
        url += '?v=2&from='
    }
    
    if (platform == "linkedin") {
        document.location = "https://www.linkedin.com/shareArticle?mini=true&url=" + encodeURIComponent(url + 'linkedin');
    } else if (platform == "facebook") {
        document.location = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url + 'facebook');
    } else if (platform == "twitter") {
        let title = document.getElementById("blogTitle").innerText;
        let tweet = title + " " + url + 'twitter';
        document.location = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweet);
    }
}

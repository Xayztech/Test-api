/*
Genius
Base : https://play.google.com/store/apps/details?id=com.genius.android
Author : ZennzXD
Created : Sabtu 2 mei 2026
*/
 
const headers = {
  'Accept-Encoding': 'gzip',
  'x-genius-app-background-request': '0',
  'x-genius-logged-out': 'true',
  'x-genius-android-version': '8.1.1',
  'user-agent': 'Genius/8.1.1 (Android; Android 13; ZN/Android)'
}
 
function parselirik(node) {
  if (typeof node === 'string') return node
  if (!node || !node.children) return ''
  if (node.tag === 'br') return '\n'
  return node.children.map(parselirik).join('')
}
 
async function detail(id) {
  const res = await fetch(`https://api.genius.com/songs/${id}`, { headers })
  const data = await res.json()
  const song = data.response.song
  
  return {
    id: song.id,
    title: song.title,
    artist: song.artist_names,
    header_image_url: song.header_image_url,
    song_art_image_url: song.song_art_image_url,
    instrumental: song.instrumental,
    is_music: song.is_music,
    hidden: song.hidden,
    explicit: song.explicit,
    release_date: song.release_date_for_display,
    url: song.url,
    lyrics: song.lyrics ? parselirik(song.lyrics.dom).trim() : null
  }
}
 
async function search(query) {
  const res = await fetch(`https://api.genius.com/search/multi?q=${encodeURIComponent(query)}`, { headers })
  const data = await res.json()
  
  const songs = []
  
  for (const section of data.response.sections) {
    if (section.type === 'song' || section.type === 'top_hit') {
      for (const hit of section.hits) {
        if (hit.type === 'song') {
          const song = hit.result
          songs.push({
            id: song.id,
            title: song.title,
            artist: song.artist_names,
            header_image_url: song.header_image_url,
            url: song.url
          })
        }
      }
    }
  }
  
  return songs
}

module.exports = { parselirik, detail, search };

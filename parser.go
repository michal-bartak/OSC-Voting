package main

import (
	"io"
	"regexp"
	"sort"
	"strconv"

	"github.com/PuerkitoBio/goquery"
)

var challengeNumberRe = regexp.MustCompile(`challengeNumber\s*=\s*(\d+)`)

func parseVotingPage(r io.Reader) (*AppState, error) {
	doc, err := goquery.NewDocumentFromReader(r)
	if err != nil {
		return nil, err
	}

	challengeNumber := 0
	doc.Find("script").Each(func(_ int, s *goquery.Selection) {
		if m := challengeNumberRe.FindStringSubmatch(s.Text()); len(m) > 1 {
			challengeNumber, _ = strconv.Atoi(m[1])
		}
	})

	scoreByPanel := map[string]int{"star5": 5, "star4": 4, "star3": 3, "star2": 2, "star1": 1, "unvotedPanel": 0}
	songMap := map[string]Song{}

	for panelID, score := range scoreByPanel {
		doc.Find("#" + panelID + " li.track").Each(func(_ int, s *goquery.Selection) {
			id, _ := s.Attr("data-track-id")
			trackURL, _ := s.Attr("data-track-url")
			title, _ := s.Attr("data-track-title")
			if id == "" {
				return
			}
			songMap[id] = Song{
				ID:            id,
				Title:         title,
				SoundCloudURL: trackURL,
				CurrentVote:   score,
			}
		})
	}

	songs := make([]Song, 0, len(songMap))
	for _, s := range songMap {
		songs = append(songs, s)
	}
	sort.Slice(songs, func(i, j int) bool {
		return songs[i].ID < songs[j].ID
	})

	return &AppState{Songs: songs, ChallengeNumber: challengeNumber}, nil
}

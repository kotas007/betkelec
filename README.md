# Overview
Created this after going through the pain of building custom things to calculate the leaderboard during the Kerala Election 2019. This can be used as the dashboard for the social prediction between friends. The web pages are constructed using bootstrap design for using on mobile devices.

# Usage
I used Typeform to collect all the election prediction from my friends and then converted them in the CSV format under `js/predict.js` folder. Another file `js/results.js` captures the outcome of the election results.

After downloading, simply edit the HTML and CSS files included with the template in your favorite text editor to make changes. These are the only files you need to worry about, you can ignore everything else! To preview the changes you make to the code, you can open the `index.html` file in your web browser.

# Scoring

- If one predicts the winner correctly, that person gets 3-points.
- One out of all the participants who predicts the closest margin by which candidate will be awarded 1-point.

# Preview

**[View Live Preview](https://kotas007.github.io/betkelec/)**

# To do

- Automate the input prediction collection.
- Automate the download of the results from election commission website.

# Tools used

- Avatars generated from [Getavataaars](https://getavataaars.com).
- Bootstrap template [New Age](https://github.com/BlackrockDigital/startbootstrap-new-age)
- Parsing of CSV using [Papa parse](http://papaparse.com/)

# Copyright and License
Code released under the [MIT](https://github.com/kotas007/betkelec/blob/master/LICENSE) license.

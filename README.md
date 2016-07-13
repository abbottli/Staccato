# Staccato
Audio visualizer using canvas. Made during Bitcamp 2016. [Devpost here](http://devpost.com/software/staccato)

You can try it out yourself or go [here](https://codepen.io/abbott/full/jqZPEb/)

Go into options and choose a song you want to see then click start. The waveform preset looks the coolest.

## How it works
I modified a random particle system generator I made to take audio data as the input instead of randomly generated values. It uses canvas to draw the shapes and AnalyserNode to get the frequency data from the audio signal. This data is used to modified the size and opacity of each shape so they react to the music. The code is a bit messy, but it more or less works.

## Options
**Enter Url**: Uses audio from url as the input. only really works if the audio file is directly accessible. CORS issues can be bypassed by using a proxy or disabling web security if you want to do that.

**Choose File**: Choose an audio file from your local system. This works the best.

**Preset**: Choice of default, floaty snow, rain, and waveform. These are just customized settings to stimulate different scenarios.

**Draw Path**: Shapes are lines instead of the floating shapes. This doesn't clear the canvas each time so you can see every iteration.

**Bounce**: Shapes bounce off edge of screen instead of continuing past it.

**Mic Mode**: Uses mic as audio input. not implemented yet.

**Shape Mode**: Pill - normal shape, Words - displays words instead from input

**Direction**: Which way the shapes float

**Number of Shapes**: Amount of shapes generated per cycle/ click.

**Spread**: Maximum distance from original position

**Speed**: How fast the shapes move up

**Spin**: How fast the shapes turn

**Size**: Length of the shapes

**Scale**: Size of shapes

**Opacity**: Level of opacity from 0 to 1

**Delay**: Time between adding new shapes

**Dimension**: Dimension for the canvas

**Background Color**: Background color of canvas

**Colors**: Set of colors the shapes cycle through

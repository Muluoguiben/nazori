import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audioExtensionFromMime, audioFilenameFromMime } from './audio-format.mjs';

test('Chromium/Firefox default audio/webm maps to webm', () => {
  assert.equal(audioExtensionFromMime('audio/webm'), 'webm');
});

test('codec parameters are stripped (audio/webm;codecs=opus)', () => {
  assert.equal(audioExtensionFromMime('audio/webm;codecs=opus'), 'webm');
});

test('iOS Safari audio/mp4 maps to mp4 (the actual bug fix)', () => {
  assert.equal(audioExtensionFromMime('audio/mp4'), 'mp4');
  assert.equal(audioExtensionFromMime('audio/mp4;codecs=mp4a.40.2'), 'mp4');
});

test('audio/aac maps to m4a (Whisper accepts m4a container, not raw aac)', () => {
  assert.equal(audioExtensionFromMime('audio/aac'), 'm4a');
});

test('audio/mpeg maps to mp3', () => {
  assert.equal(audioExtensionFromMime('audio/mpeg'), 'mp3');
});

test('mapping is case-insensitive', () => {
  assert.equal(audioExtensionFromMime('AUDIO/MP4'), 'mp4');
  assert.equal(audioExtensionFromMime('Audio/Webm; CODECS=opus'), 'webm');
});

test('unknown / empty / non-string inputs fall back to webm', () => {
  assert.equal(audioExtensionFromMime(''), 'webm');
  assert.equal(audioExtensionFromMime('audio/futuristic-format'), 'webm');
  assert.equal(audioExtensionFromMime(null), 'webm');
  assert.equal(audioExtensionFromMime(undefined), 'webm');
  assert.equal(audioExtensionFromMime(42), 'webm');
});

test('audioFilenameFromMime builds the upload filename', () => {
  assert.equal(audioFilenameFromMime('audio/mp4'), 'rep.mp4');
  assert.equal(audioFilenameFromMime('audio/webm'), 'rep.webm');
  assert.equal(audioFilenameFromMime(null), 'rep.webm');
  assert.equal(audioFilenameFromMime('audio/mpeg', 'clip'), 'clip.mp3');
});

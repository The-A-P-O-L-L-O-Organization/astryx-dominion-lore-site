#!/bin/sh
if [ -n "$POLL_SECRET" ]; then
  curl -sf -H "x-poll-secret: $POLL_SECRET" http://localhost:3000/api/poll-content
else
  curl -sf http://localhost:3000/api/poll-content
fi

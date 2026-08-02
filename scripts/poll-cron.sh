#!/bin/sh
if [ -n "$POLL_SECRET" ]; then
  response=$(curl -s -w '\n%{http_code}' -H "x-poll-secret: $POLL_SECRET" http://localhost:3000/api/poll-content)
else
  response=$(curl -s -w '\n%{http_code}' http://localhost:3000/api/poll-content)
fi
curl_status=$?
if [ $curl_status -ne 0 ]; then
  echo "poll-content request failed (curl exit $curl_status)" >&2
  exit $curl_status
fi

status=$(printf '%s' "$response" | tail -n1)
body=$(printf '%s' "$response" | sed '$d')
if [ "$status" != "200" ]; then
  echo "poll-content failed (HTTP $status): $body" >&2
  exit 1
fi

#!/bin/bash
set -e

mongo <<EOF
use $MONGO_REGULAR_DATABASE
db.createUser({
  user:  '$MONGO_REGULAR_USER',
  pwd: '$MONGO_REGULAR_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$MONGO_REGULAR_DATABASE'
  }]
})
EOF

USER=$(whoami)
sudo -u postgres createuser -s -w -e "$USER"

sudo -u postgres createdb "$USER"


down:
	docker-compose down
rmi-up:
	docker-compose down --rmi all; docker-compose up -d
restart:
	docker-compose down; docker-compose up -d
git-pull-f:
	git reset --hard @^; git pull
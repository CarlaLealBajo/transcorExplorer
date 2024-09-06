rm -rf build
yarn build

repositoryURL="207456483389.dkr.ecr.eu-west-1.amazonaws.com/mkl-visualization-tool"
version="latest"
region="eu-west-1"

# aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $repositoryUri
docker build -t $repositoryURL:$version  . --platform=linux/amd64

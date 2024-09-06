rm -rf build
yarn build
CONTAINER_ID=v0.6
image=registry.sb.upf.edu/physense/mkl-visualization-tool:$CONTAINER_ID
docker build -t $image  . --platform=linux/amd64
docker push $image

# repositoryURL="857088491492.dkr.ecr.eu-west-1.amazonaws.com/rocket-iapfront"
# docker build -t $repositoryURL:latest  .

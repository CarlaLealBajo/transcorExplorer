CONTAINER_ID=latest
image=207456483389.dkr.ecr.eu-west-1.amazonaws.com/mkl-visualization-tool:$CONTAINER_ID
docker run \
    -itd \
    -p 3000:3001 \
    $image
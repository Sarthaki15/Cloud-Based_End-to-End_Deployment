resource "aws_instance" "this" {
  count = var.instance_count

  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = var.subnet_ids[count.index]

  key_name = var.key_name
  iam_instance_profile = var.instance_profile_name

  vpc_security_group_ids = [
    var.security_group_id
  ]

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name        = "${var.environment}-server-${count.index + 1}"
    Environment = var.environment
  }
}
import os
import sys
PARENT = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.insert(0, os.path.join(PARENT, 'lib'))
# the above 4 lines allow libraries from /lib folder to be imported

import boto3
import should_trade

s3client = boto3.client('s3') # init outside of handler to promote container reuse

def handler(event, context):
    return should_trade.find('sell', s3client)
